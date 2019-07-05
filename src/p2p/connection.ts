import * as assert from 'assert';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import { Hash } from '../crypto/types';
import { ICoreSyncData, IMessage, IPeerIDType } from '../cryptonote/p2p';
import { uint32, uint8 } from '../cryptonote/types';
import { getRandomBytes } from '../util/bytes';
import { IP } from '../util/ip';
import { Handler } from './protocol/handler';

export enum ConnectionState {
  BEFORE_HANDSHAKE = 0,
  SYNCHRONIZING,
  IDLE,
  NORMAL,
  SYNC_REQURIED,
  POOL_SYNC_REQUIRED,
  SHUTDOWN,
}

export class ConnectionContext extends EventEmitter {
  public static UUID_LENGTH = 16;

  public static randomId() {
    return getRandomBytes(ConnectionContext.UUID_LENGTH);
  }

  public remoteBlockchainHeight: uint32 = 0; // uint32;
  public id: Buffer; // boost::uuids::uuid, uint8[16]
  public ip: uint32 = 0; // uint32

  protected version: uint8; // unit8
  protected port: uint32 = 0; // uint32
  // tslint:disable-next-line:variable-name
  protected _isIncoming: boolean = false;
  // tslint:disable-next-line:variable-name
  protected _state: ConnectionState = ConnectionState.BEFORE_HANDSHAKE;
  protected startTime: Date;
  protected neededObjects: Hash[];
  protected requestedObjects: Hash[];
  protected lastResponseHeight: uint32 = 0; // unit32;

  get state() {
    return this._state;
  }

  set state(state: ConnectionState) {
    this._state = state;
  }

  get isIncoming() {
    return this._isIncoming;
  }

  set isIncoming(isIncoming: boolean) {
    this._isIncoming = isIncoming;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class P2pConnectionContext extends ConnectionContext {
  // tslint:disable-next-line:variable-name
  private _peerId: IPeerIDType;
  private writeQueue: IMessage[];
  private stopped: boolean = false;
  private socket: Socket;

  constructor(socket: Socket) {
    super();
    this._peerId = Buffer.from([]);
    this.socket = socket;
    this.id = P2pConnectionContext.randomId();
    this.isIncoming = true;
    this.startTime = new Date();
    this.ip = IP.toNumber(socket.remoteAddress);
    this.port = socket.remotePort;
  }

  get peerId(): IPeerIDType {
    return this._peerId;
  }

  set peerId(peer: IPeerIDType) {
    this._peerId = peer;
  }

  public processPayLoad(
    handler: Handler,
    data: ICoreSyncData,
    first: boolean
  ): boolean {
    // Ignore none first handshake when state is not set.
    if (this.state === ConnectionState.BEFORE_HANDSHAKE && !first) {
      return true;
    }

    // Ignore handshake after synchronizing
    if (this.state !== ConnectionState.SYNCHRONIZING) {
      // Searching block by hash
      if (handler.haveBlock(data.hash)) {
        // tslint:disable-next-line:prefer-conditional-expression
        if (first) {
          //
          this.state = ConnectionState.POOL_SYNC_REQUIRED;
        } else {
          this.state = ConnectionState.NORMAL;
        }
      } else {
        // Start synchronizing if not found
        const diff = data.currentHeight - handler.height;
        assert(diff > 0);
        this.state = ConnectionState.SYNC_REQURIED;
      }
    }

    handler.updateObserverHeight(data.currentHeight, this);

    this.remoteBlockchainHeight = data.currentHeight;
    if (first) {
      handler.peers++;
    }
  }
}
