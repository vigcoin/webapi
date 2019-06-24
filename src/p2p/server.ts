import * as debug from 'debug';
import { createServer, Server, Socket } from 'net';
import * as path from 'path';
import {
  INetworkPeer,
  INodeData,
  IPeerIDType,
  IServerConfig,
  Version,
} from '../cryptonote/p2p';
import { P2pConnectionContext } from './connection';
import { Peer } from './peer';

const logger = debug('vigcoin:p2p:server');

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
  private peerId: IPeerIDType;
  private hidePort: boolean = false;
  private connections: P2pConnectionContext[];

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
    // this.peerId = Math.floor(Math.random() * 10000000000000000);
  }

  public async start() {
    logger('p2p server bootstraping...');
    // await this.init();
    await this.startServer();
    await this.connectPeers();
    // await this.onIdle();
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

  // protected async onIdle() {
  //   const timer = setTimeout(async () => {
  //     for (const peer of this.peerList) {
  //       await this.handshake(peer);
  //     }
  //   }, 1000);
  // }

  protected async startServer() {
    return new Promise((resolve, reject) => {
      const server = createServer(s => {
        this.onIncomingConnection(s);
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
      const peer = new Peer(seed.port, seed.ip);
      try {
        await peer.start();
        this.peerList.push(peer);
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error(e);
      }
    }
  }

  protected onIncomingConnection(s: Socket) {
    if (this.clientList.indexOf(s) === -1) {
      this.clientList.push(s);
    }
    this.connections.push(new P2pConnectionContext(s));
  }

  // protected handshake(peer: Peer) {
  //   const iNodeData: INodeData = this.prepareNodeData();
  // }

  // protected prepareNodeData(): INodeData {
  //   return {
  //     localTime: new Date(),
  //     myPort: this.hidePort ? 0 : this.config.port,
  //     networkId: this.networkId,
  //     peerId: this.peerId,
  //     version: Version.CURRENT,
  //   };
  // }
}
