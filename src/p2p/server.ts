import { randomBytes } from 'crypto';
import { existsSync } from 'fs';
import { createServer, Server, Socket } from 'net';
import * as path from 'path';
import { Configuration } from '../config/types';
import {
  INetwork,
  IPeerEntry,
  IPeerIDType,
  IServerConfig,
} from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { uint8 } from '../cryptonote/types';
import { logger } from '../logger';
import { getDefaultAppDir } from '../util/fs';
import { P2PConfig } from './config';
import { ConnectionState, P2pConnectionContext } from './connection';
import { LevinProtocol } from './levin';
import { Peer } from './peer';
import { PeerManager } from './peer-manager';
import { handshake, ping } from './protocol';
import { Handler } from './protocol/handler';
import { P2PStore } from './serializer';

export class P2PServer {
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
  public p2pConfig: P2PConfig;
  private config: IServerConfig;

  private pm: PeerManager;
  private clientList: Socket[] = [];
  private server: Server;
  private peerId: IPeerIDType;
  // private hidePort: boolean = false;
  private connections: Map<string, P2pConnectionContext>;
  private handler: Handler;
  private peerList: Peer[] = [];
  private network: INetwork;
  private networkId: uint8[];

  // tslint:disable-next-line:variable-name
  private _version: uint8 = 1;

  private stopped = false;

  private serializeFile: string;
  private p2pStore: P2PStore;

  constructor(
    config: IServerConfig,
    network: INetwork,
    networkId: uint8[],
    handler: Handler,
    pm: PeerManager
  ) {
    this.config = config;
    this.handler = handler;

    this.network = network;
    this.networkId = networkId;
    this.pm = pm;
    this.connections = new Map();
    this.p2pConfig = new P2PConfig();
    this.peerId = randomBytes(8);
    this.p2pConfig.seedNodes = this.p2pConfig.seedNodes.concat(
      this.config.seedNode
    );
    this.p2pConfig.seedNodes = Array.from(new Set(this.p2pConfig.seedNodes));
  }

  public async start() {
    logger.info('P2P server bootstraping...');
    await this.startServer();
    await this.connectPeers();
    // await this.onIdle();
  }

  public init(config: Configuration.IConfig) {
    logger.info('P2P server initializing ... ');
    logger.info('Seed initializing...');
    this.initSeeds(config);
    logger.info('Seed initialized!');

    if (!this.p2pConfig.dataDir) {
      this.p2pConfig.dataDir = getDefaultAppDir();
    }
    logger.info('dataDir set to : ' + this.p2pConfig.dataDir);

    if (!this.p2pConfig.filename) {
      this.p2pConfig.filename = config.extFiles.p2p;
    }
    logger.info('P2PState filename set to : ' + this.p2pConfig.filename);

    this.serializeFile = path.resolve(
      this.p2pConfig.dataDir,
      this.p2pConfig.filename
    );
    if (existsSync(this.serializeFile)) {
      logger.info('Found P2PState File : ' + this.serializeFile);
      logger.info('Reading P2PState from File : ' + this.serializeFile);
      this.p2pStore = new P2PStore(this.serializeFile);
      this.p2pStore.read(this, this.pm);
      logger.info(
        'Finished Reading P2PState from File : ' + this.serializeFile
      );
    } else {
      this.id = randomBytes(8);
      logger.info('Random P2PState Peer ID Created : ' + this.id);
    }

    for (const peer of this.p2pConfig.peers) {
      logger.info(
        'Appending peer id ' +
          peer.id +
          ', ' +
          peer.peer.ip +
          ':' +
          peer.peer.port +
          ', last seen: ' +
          peer.lastSeen
      );
      this.pm.appendWhite(peer);
    }
  }

  public initSeeds(config: Configuration.IConfig) {
    this.p2pConfig.seedNodes.concat(
      this.p2pConfig.parseNode(config.seeds.join(','))
    );
    this.p2pConfig.seedNodes = Array.from(new Set(this.p2pConfig.seedNodes));
  }

  public async stop() {
    logger.info('stopping Peers...');
    for (const peer of this.peerList) {
      await peer.stop();
    }
    logger.info('Peers stopped');

    if (this.server) {
      logger.info('P2P Server stopping...');
      await new Promise((resolve, reject) => {
        this.server.close(e => {
          if (e) {
            logger.error('Error stopping P2P server!');
            logger.error(e);
            return reject(e);
          }
          logger.info('P2P Server stopped');
          resolve();
        });
      });
    }
  }

  public getPeers() {
    return this.peerList;
  }

  public initContext(s: Socket, inComing: boolean = true, peer: Peer = null) {
    if (inComing) {
      logger.info('New incoming context creating');
    } else {
      logger.info('New outcoming context creating');
    }
    const context = new P2pConnectionContext(s);
    context.isIncoming = inComing;
    const levin = new LevinProtocol(s);
    this.connections.set(context.id.toString('hex'), context);
    levin.on('state', (state: ConnectionState) => {
      logger.info(
        'Context state changed from ' + context.state + ' to ' + state
      );
      context.state = state;
    });
    levin.on('handshake', (data: handshake.IRequest) => {
      logger.info('Receiving handshaking command!');
      this.onHandshake(data, context, levin);
    });
    s.on('data', buffer => {
      logger.info('Receiving new data!');
      try {
        levin.onIncomingData(
          new BufferStreamReader(buffer),
          context,
          this.handler
        );
        if (context.state === ConnectionState.SHUTDOWN) {
          s.destroy();
        }
      } catch (e) {
        logger.error('Error processing new data!');
        if (peer) {
          this.removePeer(peer);
          peer.stop();
        } else {
          s.destroy();
        }
        this.connections.delete(context.id.toString('hex'));
      }
    });
    s.on('end', () => {
      logger.info('Connection ended!');
      s.destroy();
    });
    return {
      context,
      levin,
    };
  }

  public removePeer(peer: Peer) {
    logger.info('Peer processing new data!');

    const index = this.peerList.indexOf(peer);
    if (index !== -1) {
      this.peerList.splice(index, 1);
    }
  }

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
    const seeds = this.p2pConfig.seedNodes;
    for (const seed of seeds) {
      const peer = new Peer(seed.port, seed.ip);
      try {
        await peer.start(this, this.network);
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
