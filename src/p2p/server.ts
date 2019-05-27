import { createServer, Server, Socket } from 'net';
import * as path from 'path';
import {
  INetworkPeer,
  INodeData,
  IServerConfig,
  Version,
} from '../cryptonote/p2p';
import { Peer } from './peer';
export class P2PServer {
  private config: IServerConfig;
  private folder: string;
  private filename: string;
  private absoluteFileName: string;
  private peerList: Peer[] = [];
  private clientList: Socket[] = [];
  private server: Server;
  private networkPeer: INetworkPeer;
  private networkId: number[];
  private peerId: number;
  private hidePort: boolean = false;
  constructor(
    config: IServerConfig,
    networkPeer: INetworkPeer,
    networkId: number[],
    folder: string,
    filename: string
  ) {
    this.config = config;
    this.networkPeer = networkPeer;
    this.networkId = networkId;
    this.folder = folder;
    this.filename = filename;
    this.absoluteFileName = path.resolve(folder, filename);
    this.peerId = Math.floor(Math.random() * 10000000000000000);
  }

  public async start() {
    // await this.init();
    await this.startServer();
    await this.connectPeers();
    await this.onIdle();
  }

  public async stop() {
    for (const peer of this.peerList) {
      await peer.stop();
    }
    if (this.server) {
      await new Promise((resolve, reject) => {
        this.server.close(e => {
          if (e) {
            return reject(e);
          }
          resolve();
        });
      });
    }
  }

  public getPeers() {
    return this.peerList;
  }

  protected async onIdle() {
    const timer = setTimeout(async () => {
      for (const peer of this.peerList) {
        await this.handshake(peer);
      }
    }, 1000);
  }

  protected async startServer() {
    return new Promise((resolve, reject) => {
      const server = createServer(s => {
        this.onClient(s);
      });
      const { port, host } = this.config;
      server.listen({ port, host }, e => {
        if (e) {
          this.server = null;
          return reject(e);
        }
        resolve(server);
      });
      this.server = server;
    });
  }

  protected async connectPeers() {
    const seeds = this.config.seedNode;
    for (const seed of seeds) {
      const peer = new Peer(seed.port, seed.host);
      try {
        await peer.start();
        this.peerList.push(peer);
      } catch (e) {
        console.error(e);
      }
    }
  }

  protected onClient(s: Socket) {
    if (this.clientList.indexOf(s) === -1) {
      this.clientList.push(s);
    }
  }

  protected handshake(peer: Peer) {
    const iNodeData: INodeData = this.prepareNodeData();
  }

  protected prepareNodeData(): INodeData {
    return {
      localTime: new Date(),
      myPort: this.hidePort ? 0 : this.config.port,
      networkId: this.networkId,
      peerId: this.peerId,
      version: Version.CURRENT,
    };
  }
}
