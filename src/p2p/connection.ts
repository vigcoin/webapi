import * as assert from 'assert';
import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { createConnection, Socket } from 'net';
import { Hash } from '../crypto/types';
import {
  ICoreSyncData,
  IMessage,
  INetwork,
  IPeer,
  IPeerIDType,
} from '../cryptonote/p2p';
import { uint32, uint8 } from '../cryptonote/types';
import { logger } from '../logger';
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
    return randomBytes(ConnectionContext.UUID_LENGTH);
  }

  public remoteBlockchainHeight: uint32 = 0; // uint32;
  public id: Buffer; // boost::uuids::uuid, uint8[16]
  public ip: uint32 = 0; // uint32
  public port: uint32 = 0; // uint32

  protected version: uint8; // unit8
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
  public static createConnection(
    peer: IPeer,
    network: INetwork
  ): Promise<Socket> {
    const host = IP.toString(peer.ip);
    const port = peer.port;
    let timer: NodeJS.Timeout;
    return new Promise(async (resolve, reject) => {
      logger.info('start connecting: ' + host + ':' + port);
      const s = createConnection(port, host, () => {
        logger.info('Successfually connected to ' + host + ':' + port);
        clearTimeout(timer);
        resolve(s);
      });
      s.on('error', e => {
        logger.error('Connecting to ' + host + ':' + port + ' errored!');
        s.destroy();
        reject(e);
      });
      timer = setTimeout(() => {
        logger.error('Connecting to ' + host + ':' + port + ' time out!');
        const e = new Error('Time out!');
        s.destroy();
        reject(e);
      }, network.conectionTimeout);
    });
  }
  public socket: Socket;
  public version: uint32;

  // tslint:disable-next-line:variable-name
  private _peerId: IPeerIDType;
  private writeQueue: IMessage[];
  private stopped: boolean = false;

  constructor(socket: Socket) {
    super();
    this._peerId = Buffer.from([]);
    this.socket = socket;
    this.id = P2pConnectionContext.randomId();
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

  public stop() {
    this.socket.end();
    this.socket.destroy();
  }
}
