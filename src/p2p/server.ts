import * as debug from 'debug';
import { createServer, Server, Socket } from 'net';
import { IPeerEntry, IPeerIDType, IServerConfig } from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { uint8 } from '../cryptonote/types';
import { ConnectionState, P2pConnectionContext } from './connection';
import { LevinProtocol } from './levin';
import { Peer } from './peer';
import { PeerManager } from './peer-manager';
import { handshake, ping } from './protocol';
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
  private peerId: IPeerIDType;
  // private hidePort: boolean = false;
  private connections: Map<string, P2pConnectionContext>;
  private handler: Handler;
  private peerList: Peer[] = [];

  // tslint:disable-next-line:variable-name
  private _version: uint8 = 1;

  constructor(
    config: IServerConfig,
    // networkPeer: INetworkPeer,
    networkId: number[],
    // folder: string,
    // filename: string,
    handler: Handler,
    pm: PeerManager
  ) {
    this.config = config;
    // this.folder = folder;
    // this.filename = filename;
    // this.absoluteFileName = path.resolve(folder, filename);
    this.handler = handler;
    this.pm = pm;
    this.connections = new Map();
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

  public initContext(s: Socket, inComing: boolean) {
    const context = new P2pConnectionContext(s);
    context.isIncoming = inComing;
    const levin = new LevinProtocol(s);
    this.connections.set(context.id.toString('hex'), context);
    levin.on('state', (state: ConnectionState) => {
      context.state = state;
    });
    levin.on('handshake', (data: handshake.IRequest) => {
      this.onHandshake(data, context, levin);
    });
    s.on('data', buffer => {
      try {
        levin.onIncomingData(
          new BufferStreamReader(buffer),
          context,
          this.handler
        );
      } catch (e) {
        // TODO: onclose
        // this.handler.onClose();
        s.destroy();
        this.connections.delete(context.id.toString('hex'));
      }
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

  // acceptLoop of the original code
  protected onIncomingConnection(s: Socket) {
    if (this.clientList.indexOf(s) === -1) {
      this.clientList.push(s);
    }
    this.initContext(s, true);
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
      levin.tryPing(data.node, context);
      levin.once('ping', (response: ping.IResponse) => {
        this.onPing(response, data, context);
      });
    }
  }

  private onPing(
    response: ping.IResponse,
    data: handshake.IRequest,
    context: P2pConnectionContext
  ) {
    if (
      response.status === ping.PING_OK_RESPONSE_STATUS_TEXT &&
      response.peerId.equals(data.node.peerId)
    ) {
      const pe: IPeerEntry = {
        lastSeen: new Date(),
        peer: {
          ip: context.ip,
          port: data.node.myPort,
        },
        // tslint:disable-next-line:object-literal-sort-keys
        id: data.node.peerId,
      };
      this.pm.appendWhite(pe);
    }
  }
}
