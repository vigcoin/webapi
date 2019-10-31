import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { createConnection, Socket } from 'net';
import { IHash } from '../crypto/types';
import { BlockChain } from '../cryptonote/block/blockchain';
import { Hardfork } from '../cryptonote/block/hardfork';
import { MemoryPool } from '../cryptonote/mem-pool';
import { INetwork, IPeer, IPeerIDType } from '../cryptonote/p2p';
import { uint32, uint8 } from '../cryptonote/types';
import { logger } from '../logger';
import { IP } from '../util/ip';
import { ConnectionManager } from './connection-manager';
import { PeerManager } from './peer-manager';
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

  public static state2String(state: ConnectionState) {
    switch (state) {
      case ConnectionState.BEFORE_HANDSHAKE:
        return 'BEFORE_HANDSHAKE';
      case ConnectionState.SYNCHRONIZING:
        return 'SYNCHRONIZING';
      case ConnectionState.IDLE:
        return 'IDLE';
      case ConnectionState.NORMAL:
        return 'NORMAL';
      case ConnectionState.SYNC_REQURIED:
        return 'SYNC_REQURIED';
      case ConnectionState.POOL_SYNC_REQUIRED:
        return 'POOL_SYNC_REQUIRED';
      case ConnectionState.SHUTDOWN:
        return 'SHUTDOWN';
    }
  }

  public remoteBlockchainHeight: uint32 = 0; // uint32;
  public lastResponseHeight: uint32 = 0; // unit32;
  public id: Buffer; // boost::uuids::uuid, uint8[16]
  public ip: uint32 = 0; // uint32
  public port: uint32 = 0; // uint32

  protected version: uint8; // unit8
  // tslint:disable-next-line:variable-name
  protected _isIncoming: boolean = false;
  // tslint:disable-next-line:variable-name
  protected _state: ConnectionState = ConnectionState.BEFORE_HANDSHAKE;
  protected startTime: Date;
  protected neededObjects: IHash[];
  protected requestedObjects: IHash[];

  get state() {
    return this._state;
  }

  set state(state: ConnectionState) {
    this._state = state;
    this.emit('state', state);
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
    return new Promise(async (resolve, reject) => {
      let timer: NodeJS.Timeout;
      logger.info('start connecting: ' + host + ':' + port);
      const s = createConnection(port, host, () => {
        logger.info('Successfually connected to ' + host + ':' + port);
        clearTimeout(timer);
        resolve(s);
      });
      s.on('error', e => {
        logger.error('Connecting to ' + host + ':' + port + ' errored!');
        clearTimeout(timer);
        s.destroy();
        reject(e);
      });
      timer = setTimeout(() => {
        clearTimeout(timer);
        const message = 'Connecting to ' + host + ':' + port + ' time out!';
        logger.error(message);
        const e = new Error(message);
        s.destroy();
        reject(e);
      }, network.conectionTimeout);
    });
  }

  public pm: PeerManager;
  public cm: ConnectionManager;
  public handler: Handler;
  public blockchain: BlockChain;
  public mempool: MemoryPool;
  public socket: Socket;
  public version: uint32;

  public hardfork: Hardfork;

  // tslint:disable-next-line:variable-name
  private _peerId: IPeerIDType;

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
    this.socket = null;
  }
}
