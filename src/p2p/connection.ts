import { EventEmitter } from 'events';
import { Socket } from 'net';
import * as uuid from 'uuid';
import { Hash } from '../crypto/types';
import { IMessage, IP2Number, IPeerIDType } from '../cryptonote/p2p';
import { uint32, uint8 } from '../cryptonote/types';
import { LevinProtocol } from './levin';

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
  protected version: uint8; // unit8
  protected id: string; // boost::uuids::uuid
  protected ip: uint32; // uint32
  protected port: uint32 = 0; // uint32
  protected isIncoming: boolean = false;
  protected startTime: Date;
  protected state: ConnectionState = ConnectionState.BEFORE_HANDSHAKE;
  protected neededObjects: Hash[];
  protected requestedObjects: Hash[];
  protected remoteBlockchainHeight: uint32 = 0; // uint32;
  protected lastResponseHeight: uint32 = 0; // unit32;

  public getState() {
    return this.state;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class P2pConnectionContext extends ConnectionContext {
  private peerId: IPeerIDType;
  private writeQueue: IMessage[];
  private stopped: boolean = false;
  private socket: Socket;
  private levin: LevinProtocol;

  constructor(socket: Socket) {
    super();
    this.peerId = this.getRandomPeerId();
    this.socket = socket;
    this.id = uuid.v4();
    this.isIncoming = true;
    this.startTime = new Date();
    this.ip = IP2Number(socket.remoteAddress);
    this.port = socket.remotePort;
    this.levin = new LevinProtocol(socket, this);

    this.levin.on('state', (state: ConnectionState) => {
      this.state = state;
    });
  }

  public getRandomPeerId() {
    const random = [];
    for (let i = 0; i < 8; i++) {
      random.push(Math.floor(Math.random() * 256));
    }
    return Buffer.from(random).readDoubleLE(0);
  }
}
