import { createConnection, Socket } from 'net';
import { INetwork } from '../cryptonote/p2p';
import { uint32 } from '../cryptonote/types';
import { logger } from '../logger';
import { IP } from '../util/ip';
import { P2PServer } from './server';

export class Peer {
  private socket: Socket;
  private port: uint32;
  private ip: uint32;
  private host: string;
  private id: number;
  private connected: boolean = false;
  private started: Date;
  private timer: NodeJS.Timeout;

  constructor(port: uint32, ip: uint32) {
    this.port = port;
    this.ip = ip;
    this.host = IP.toString(ip);
  }
  public async start(p2pServer: P2PServer, net: INetwork) {
    return new Promise(async (resolve, reject) => {
      logger.info('start connecting: ' + this.host + ':' + this.port);
      const s = createConnection({ port: this.port, host: this.host }, e => {
        if (e) {
          this.onError(e, p2pServer);
          reject(e);
        } else {
          logger.info(
            'Successfually connected to ' + this.host + ':' + this.port
          );
          clearTimeout(this.timer);
          this.onConnected();
          p2pServer.initContext(s, false);
          resolve();
        }
      });
      this.socket = s;
      this.timer = setTimeout(() => {
        const e = new Error('Time out!');
        this.onError(e, p2pServer);
        reject(e);
      }, net.conectionTimeout);
    });
  }
  public onError(e: Error, p2pServer: P2PServer) {
    logger.error('Error connecting to ' + this.host + ':' + this.port + '!');
    logger.error(e);
    p2pServer.removePeer(this);
    this.stop();
  }

  public async onConnected() {
    this.connected = true;
  }

  public stop() {
    this.socket.end();
    this.socket.destroy();
  }
}
