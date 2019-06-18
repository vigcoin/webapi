import { EventEmitter } from 'events';
import { Socket } from 'net';
import * as uuid from 'uuid';
import { Hash } from '../crypto/types';
import { IMessage, IPeerIDType } from '../cryptonote/p2p';
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
  protected version: number; // unit8
  protected id: string; // boost::uuids::uuid
  protected ip: string; // uint32
  protected port: number = 0; // uint32
  protected isIncoming: boolean = false;
  protected startTime: Date;
  protected state: ConnectionState = ConnectionState.BEFORE_HANDSHAKE;
  protected neededObjects: Hash[];
  protected requestedObjects: Hash[];
  protected remoteBlockchainHeight: number = 0; // uint32;
  protected lastResponseHeight: number = 0; // unit32;

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
    this.socket = socket;
    this.id = uuid.v4();
    this.isIncoming = true;
    this.startTime = new Date();
    this.ip = socket.remoteAddress;
    this.port = socket.remotePort;
    this.levin = new LevinProtocol(socket);

    this.levin.on('state', (state: ConnectionState) => {
      this.state = state;
    });
  }
}
