import { createConnection, Socket } from 'net';
import { Hash, HASH_LENGTH } from '../crypto/types';
import { ICoreSyncData, INodeData } from '../cryptonote/p2p';

import * as debug from 'debug';
import { uint32 } from '../cryptonote/types';
import { IP } from '../util/ip';
import { P2pConnectionContext } from './connection';

const logger = debug('vigcoin:p2p:peer');

export class Peer {
  private socket: Socket;
  private port: uint32;
  private ip: uint32;
  private host: string;
  private id: number;
  private connected: boolean = false;
  private started: Date;

  constructor(port: uint32, ip: uint32) {
    this.port = port;
    this.ip = ip;
    this.host = IP.toString(ip);
  }
  public async start() {
    return new Promise(async (resolve, reject) => {
      logger('start connecting: ' + this.host + ':' + this.port);
      const s = createConnection({ port: this.port, host: this.host }, e => {
        if (e) {
          logger('Error connection: ' + this.host + ':' + this.port);
          logger(e);
          s.destroy();
          reject(e);
        } else {
          logger('Successfually connection: ' + this.host + ':' + this.port);
          this.onConnected();
          resolve();
        }
      });
      this.socket = s;
    });
  }

  public async onConnected() {
    this.connected = true;
  }

  public stop() {
    this.socket.end();
  }

  public isConnected() {
    return this.connected;
  }
}
