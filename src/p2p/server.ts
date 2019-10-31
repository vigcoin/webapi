import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { createServer, Server, Socket } from 'net';
import * as path from 'path';
import { p2p } from '../config';
import { BLOCKCHAIN_SYNCHRONZIED } from '../config/events';
import { Configuration } from '../config/types';
import {
  INetwork,
  IPeer,
  IPeerEntry,
  IPeerIDType,
  IServerConfig,
} from '../cryptonote/p2p';
import { uint8 } from '../cryptonote/types';
import { logger } from '../logger';
import { getDefaultAppDir } from '../util/fs';
import { P2PConfig } from './config';
import { ConnectionManager } from './connection-manager';
import { PeerManager } from './peer-manager';
import { Handler } from './protocol/handler';
import { P2PStore } from './store';

export class P2PServer extends EventEmitter {
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
  public p2pStore: P2PStore;
  public serializeFile: string;
  public pm: PeerManager;

  private serverConfig: IServerConfig;

  private server: Server;
  private peerId: IPeerIDType;
  // private hidePort: boolean = false;
  private connectionManager: ConnectionManager;
  private handler: Handler;
  private network: INetwork;
  // private networkId: uint8[];

  // tslint:disable-next-line:variable-name
  private _version: uint8 = 1;

  private stopped = false;
  private isConnecting = false;

  constructor(
    serverConfig: IServerConfig,
    network: INetwork,
    networkId: uint8[],
    handler: Handler,
    pm: PeerManager
  ) {
    super();
    this.serverConfig = serverConfig;
    this.handler = handler;

    this.network = network;
    // this.networkId = networkId;
    this.pm = pm;
    this.peerId = randomBytes(8);

    this.p2pConfig = new P2PConfig();
    this.p2pConfig.seedNodes = this.p2pConfig.seedNodes.concat(
      this.serverConfig.seedNode
    );
    this.p2pConfig.seedNodes = Array.from(new Set(this.p2pConfig.seedNodes));

    this.connectionManager = new ConnectionManager(
      this.peerId,
      networkId,
      this.p2pConfig,
      this.handler
    );

    this.handler.on(BLOCKCHAIN_SYNCHRONZIED, () => {
      this.emit(BLOCKCHAIN_SYNCHRONZIED, this.connectionManager.getHeight());
    });
  }

  // Main process
  public async start() {
    logger.info('P2P server bootstraping...');
    await this.startServer();
    this.onIdle();
    this.timedSyncLooping();
  }

  public async onIdle() {
    logger.info('Start idle');
    const timer = setTimeout(async () => {
      await this.startConnection();
      clearTimeout(timer);
      const interval = setInterval(async () => {
        // await this.startConnection();
        P2PStore.saveStore(this);
      }, 60 * 30 * 1000);
    }, 0);
  }

  public timedSyncLooping() {
    logger.info('Starting timed sync looping');
    const timer = setTimeout(async () => {
      clearTimeout(timer);
      setInterval(() => {
        this.connectionManager.timedsync();
      }, this.network.handshakeInterval * 1000);
    }, 0);
  }

  public init(globalConfig: Configuration.IConfig) {
    logger.info('P2P server initializing ... ');
    logger.info('Seed initializing...');
    this.initSeeds(globalConfig);
    logger.info('Seed initialized!');

    if (!this.p2pConfig.dataDir) {
      this.p2pConfig.dataDir = getDefaultAppDir();
    }
    logger.info('dataDir set to : ' + this.p2pConfig.dataDir);

    if (!this.p2pConfig.filename) {
      this.p2pConfig.filename = globalConfig.extFiles.p2p;
    }
    logger.info('P2PState filename set to : ' + this.p2pConfig.filename);

    this.serializeFile = path.resolve(
      this.p2pConfig.dataDir,
      this.p2pConfig.filename
    );

    // create a random id if persistance file not existed
    if (!P2PStore.getStore(this)) {
      this.id = randomBytes(8);
      logger.info(
        'Random P2PState Peer ID Created : ' + this.id.toString('hex')
      );
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

  public initSeeds(globalConfig: Configuration.IConfig) {
    this.p2pConfig.seedNodes.concat(globalConfig.seeds);
    this.p2pConfig.seedNodes = Array.from(new Set(this.p2pConfig.seedNodes));
  }

  public async stop() {
    this.connectionManager.stop();
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

  protected async startServer() {
    return new Promise((resolve, reject) => {
      const server = createServer(s => {
        this.connectionManager.initContext(this.pm, s, true);
      });
      const { port, host } = this.serverConfig;
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

  protected async startConnection() {
    logger.info('Starting connecting peers!');
    if (this.isConnecting) {
      logger.warn('In connecting!');
      return;
    }
    this.isConnecting = true;
    // Check exclusive nodes
    if (this.p2pConfig.exclusiveNodes.length) {
      logger.info('Exclusive nodes!');
      await this.connectPeers(this.p2pConfig.exclusiveNodes);
      return;
    }

    if (!this.pm.white.length && this.p2pConfig.seedNodes.length) {
      logger.info('Connecting to seed nodes!');
      await this.connectPeers(this.p2pConfig.seedNodes);
    }
    if (this.p2pConfig.priorityNodes.length) {
      logger.info('Connecting to priority nodes!');
      await this.connectPeers(this.p2pConfig.priorityNodes);
    }
    await this.checkConnection();
    this.isConnecting = false;
  }

  protected async checkConnection() {
    logger.info('Check connection!');
    const expectedWhiteConPercent =
      (this.network.connectionsCount *
        p2p.P2P_DEFAULT_WHITELIST_CONNECTIONS_PERCENT) /
      100;

    logger.info(
      'Expected white connections default percent : ' + expectedWhiteConPercent
    );
    const connectionCount = this.connectionManager.getOutGoingConnectionCount();

    logger.info('Current connection count : ' + connectionCount);
    if (connectionCount < expectedWhiteConPercent) {
      if (
        await this.makeExpectedConnectionCount(true, expectedWhiteConPercent)
      ) {
        return;
      }
      await this.makeExpectedConnectionCount(
        false,
        this.network.connectionsCount
      );
    } else {
      logger.info('Connecting gray list! ');
      if (
        await this.makeExpectedConnectionCount(
          false,
          this.network.connectionsCount
        )
      ) {
        return;
      }
      logger.info('Connecting white list!');
      await this.makeExpectedConnectionCount(
        true,
        this.network.connectionsCount
      );
    }
  }

  protected async makeExpectedConnectionCount(
    isWhite: boolean,
    expectedCount: number
  ): Promise<boolean> {
    let currentCount = 0;
    let peers: IPeerEntry[] = this.pm.gray;
    if (isWhite) {
      logger.info('Use white list!');
      peers = this.pm.white;
    }
    for (const peer of peers) {
      if (!this.connectionManager.isPeerConnected(peer.peer)) {
        try {
          await this.connectionManager.connect(
            this.network,
            this.pm,
            peer.peer,
            false
          );
        } catch (e) {
          logger.error(e);
        }
        currentCount = this.connectionManager.getOutGoingConnectionCount();
        if (currentCount >= expectedCount) {
          break;
        }
      }
    }
    currentCount = this.connectionManager.getOutGoingConnectionCount();
    if (currentCount < expectedCount) {
      return false;
    }
    return true;
  }

  protected async connectPeers(peers: IPeer[]) {
    logger.info('Connecting to peers!');
    for (const peer of peers) {
      if (!this.connectionManager.isPeerConnected(peer)) {
        try {
          await this.connectionManager.connect(
            this.network,
            this.pm,
            peer,
            true
          );
        } catch (e) {
          logger.error(e);
        }
      }
    }
  }
}
