import { createConnection, Socket } from 'net';
import { Hash, BaseBuffer } from '../crypto/types';
import { ICoreSyncData, INodeData, Version } from '../cryptonote/p2p';

export class Peer {
  private socket: Socket;
  private port: number;
  private host: string;
  private id: number;
  private connected: boolean = false;
  private started: Date;

  constructor(port: number, host: string) {
    this.port = port;
    this.host = host;
  }
  public async start() {
    return new Promise(async (resolve, reject) => {
      const s = createConnection({ port: this.port, host: this.host }, e => {
        if (e) {
          s.destroy();
          reject(e);
        } else {
          this.onConnected();
          resolve();
        }
      });
      this.socket = s;
      s.on('data', async data => {
        await this.update(data);
      });
      s.on('end', async () => {
        await this.onEnd();
      });
    });
  }

  public async onConnected() {
    this.connected = true;
    console.log('connected');
  }

  public async update(data) {
    console.log('updating');
    console.log(data);
  }

  public stop() {
    console.log('stopping');
    this.socket.end();
  }

  public async onEnd() {
    this.connected = false;
    console.log('onEnd');
  }

  public isConnected() {
    return this.connected;
  }

  public prepareCoreData(
    hash: Hash = BaseBuffer.getBuffer(),
    height: number = 0
  ): ICoreSyncData {
    return {
      currentHeight: height,
      hash,
    };
  }
  public async handshake(coreData: ICoreSyncData, nodeData: INodeData) {
    this.started = new Date();
  }
}
