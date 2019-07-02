import * as debug from 'debug';
import { createServer, Server, Socket } from 'net';
import * as path from 'path';
import {
  ICoreSyncData,
  INetworkPeer,
  INodeData,
  IPeerIDType,
  IServerConfig,
  Version,
} from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { uint8 } from '../cryptonote/types';
import { ConnectionState, P2pConnectionContext } from './connection';
import { LevinProtocol } from './levin';
import { Peer } from './peer';
import { PeerManager } from './peer-manager';
import { handshake } from './protocol';
import { Handler } from './protocol/handler';

const logger = debug('vigcoin:p2p:server');

export class P2PServer {
  private config: IServerConfig;
  // private folder: string;
  // private filename: string;
  // private absoluteFileName: string;
  private pm: PeerManager;
  private clientList: Socket[] = [];
  private server: Server;
  // private networkPeer: INetworkPeer;
  // private networkId: number[];
  private peerId: IPeerIDType;
  // private hidePort: boolean = false;
  private connections: P2pConnectionContext[];
  private handler: Handler;
  private peerList: Peer[] = [];

  // tslint:disable-next-line:variable-name
  private _version: uint8 = 1;

  constructor(
    config: IServerConfig,
    // networkPeer: INetworkPeer,
    // networkId: number[],
    // folder: string,
    // filename: string,
    handler: Handler,
    pm: PeerManager
  ) {
    this.config = config;
    // this.networkPeer = networkPeer;
    // this.networkId = networkId;
    // this.folder = folder;
    // this.filename = filename;
    // this.absoluteFileName = path.resolve(folder, filename);
    this.handler = handler;
    this.pm = pm;

    handler.on(
      'handshake',
      (
        data: handshake.IRequest,
        context: P2pConnectionContext,
        levin: LevinProtocol
      ) => {
        this.onHandshake(data, context, levin);
      }
    );
  }

  get version(): uint8 {
    return this._version;
  }

  set version(version: uint8) {
    this._version = version;
  }

  get id() {
    return this.peerId;
  }
  set id(id: IPeerIDType) {
    this.peerId = id;
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

  public initContext(s: Socket) {
    const context = new P2pConnectionContext(s);
    const levin = new LevinProtocol(s);
    levin.on('state', (state: ConnectionState) => {
      context.state = state;
    });
    s.on('data', buffer => {
      levin.onIncomingData(
        new BufferStreamReader(buffer),
        context,
        this.handler
      );
    });
    s.on('end', () => {
      s.destroy();
    });
    return {
      context,
      levin,
    };
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
    const context = this.initContext(s);
    this.connections.push(context.context);
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

  private onHandshake(
    data: handshake.IRequest,
    context: P2pConnectionContext,
    levin: LevinProtocol
  ) {
    if (!data.node.peerId.equals(this.peerId) && data.node.myPort !== 0) {
      const peerId = data.node.peerId;
      const port = data.node.myPort;
      levin.tryPing(data, context);
    }
  }
}
