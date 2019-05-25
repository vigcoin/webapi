import { createConnection, Socket } from "net";
import { ICoreSyncData, INodeData, Version } from "./types";
import { Hash, NULL_HASH } from "../crypto/types";

export class Peer {
  private socket: Socket;
  private port: number;
  private host: string;
  private id: number;
  private connected: boolean = false;
  constructor(port: number, host: string) {
    this.port = port;
    this.host = host;
  }
  public async  start() {
    return new Promise(async (resolve, reject) => {
      const s = createConnection({ port: this.port, host: this.host }, (e) => {
        if (e) {
          s.destroy();
          reject(e);
        } else {
          this.onConnected();
          resolve();
        }
      });
      this.socket = s;
      s.on('data', async (data) => {
        await this.update(data);
      });
      s.on('end', async () => {
        await this.onEnd();
      });
    });

  }

  public async onConnected() {
    this.connected = true;
    console.log("connected");
  }

  public async update(data) {
    console.log("updating");
    console.log(data);
  }

  public stop() {
    console.log("stopping");
    this.socket.end();
  }

  public async onEnd() {
    this.connected = false;
    console.log('onEnd');
  }

  public isConnected() {
    return this.connected;
  }

  // Protocols 

  public prepareNodeData(port: number, uuid: string): INodeData {
    return {
      localTime: new Date(),
      myPort: port,
      networkId: uuid,
      peerId: Math.floor((Math.random() * 10000000000000000)),
      version: Version.CURRENT
    };
  }

  public prepareCoreData(hash: Hash = NULL_HASH, height: number = 0): ICoreSyncData {
    return {
      currentHeight: height,
      hash
    };
  }
  public async handshake(coreData: ICoreSyncData, nodeData: INodeData) {
    
  }

}