import * as assert from 'assert';
import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';
import { closeSync, existsSync, openSync } from 'fs';
import * as moment from 'moment';
import { createConnection, createServer, Server, Socket } from 'net';
import * as path from 'path';
import { p2p } from '../config';
import { BLOCKCHAIN_SYNCHRONZIED } from '../config/events';
import { Configuration } from '../config/types';
import {
  ICoreSyncData,
  INetwork,
  IPeer,
  IPeerEntry,
  IPeerIDType,
  IPeerNodeData,
  IServerConfig,
  Version,
} from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../cryptonote/serialize/writer';
import { uint8 } from '../cryptonote/types';
import { logger } from '../logger';
import { getDefaultAppDir } from '../util/fs';
import { IP } from '../util/ip';
import { P2PConfig } from './config';
import { ConnectionState, P2pConnectionContext } from './connection';
import { ConnectionManager } from './connection-manager';
import { LevinProtocol } from './levin';
import { PeerList, PeerManager } from './peer-manager';
import { handshake, ping } from './protocol';
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

  private config: IServerConfig;

  private pm: PeerManager;
  private clientList: Socket[] = [];
  private server: Server;
  private peerId: IPeerIDType;
  // private hidePort: boolean = false;
  private connectionManager: ConnectionManager;
  private handler: Handler;
  private network: INetwork;
  private networkId: uint8[];

  // tslint:disable-next-line:variable-name
  private _version: uint8 = 1;

  private stopped = false;
  private isConnecting = false;

  private serializeFile: string;

  constructor(
    config: IServerConfig,
    network: INetwork,
    networkId: uint8[],
    handler: Handler,
    pm: PeerManager
  ) {
    super();
    this.config = config;
    this.handler = handler;

    this.network = network;
    this.networkId = networkId;
    this.pm = pm;
    this.connectionManager = new ConnectionManager();
    this.p2pConfig = new P2PConfig();
    this.peerId = randomBytes(8);
    this.p2pConfig.seedNodes = this.p2pConfig.seedNodes.concat(
      this.config.seedNode
    );
    this.p2pConfig.seedNodes = Array.from(new Set(this.p2pConfig.seedNodes));
    this.handler.on(BLOCKCHAIN_SYNCHRONZIED, () => {
      this.emit(BLOCKCHAIN_SYNCHRONZIED, this.connectionManager.getHeight());
    });
  }

  // Main process
  public async start() {
    logger.info('P2P server bootstraping...');
    await this.startServer();
    this.onIdle();
  }

  public async onIdle() {
    const interval = setInterval(async () => {
      await this.startConnection();
      P2PStore.saveStore(this.serializeFile, this, this.pm);
    }, this.network.handshakeInterval * 1000);
  }

  // try_to_connect_and_handshake_with_new_peer
  public async connect(peer: IPeer, handshakeOnly: boolean) {
    const s = await P2pConnectionContext.createConnection(peer, this.network);
    if (handshakeOnly) {
      await this.handshake(s, handshakeOnly);
      return;
    }
    const { context } = this.initContext(s, false);
    const pe: IPeerEntry = {
      id: context.peerId,
      lastSeen: new Date(),
      peer,
    };
    this.pm.appendWhite(pe);
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

    const exists = existsSync(this.serializeFile);

    // create a random id if no store info exists
    if (!exists) {
      this.id = randomBytes(8);
      logger.info(
        'Random P2PState Peer ID Created : ' + this.id.toString('hex')
      );
    }

    // Make sure p2p store exist
    this.p2pStore = P2PStore.getStore(
      this.serializeFile,
      this,
      this.pm,
      exists
    );

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
    this.p2pConfig.seedNodes.concat(config.seeds);
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

  public initContext(s: Socket, inComing: boolean = true) {
    if (inComing) {
      logger.info('New incoming context creating');
    } else {
      logger.info('New outgoing context creating');
    }
    const context = new P2pConnectionContext(s);
    context.isIncoming = inComing;
    const levin = new LevinProtocol(s);
    return this.initLevin(s, context, levin);
  }

  protected initLevin(
    s: Socket,
    context: P2pConnectionContext,
    levin: LevinProtocol
  ) {
    this.connectionManager.set(context);
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
        s.destroy();
        this.connectionManager.remove(context);
      }
    });
    s.on('end', () => {
      logger.info(
        'Connection ' + s.remoteAddress + ':' + s.remotePort + ' ended!'
      );
      s.destroy();
    });
    return {
      context,
      levin,
    };
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

  protected async startConnection() {
    if (this.isConnecting) {
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
          await this.connect(peer.peer, false);
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
          await this.connect(peer, true);
        } catch (e) {
          logger.error(e);
        }
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

  private async handshake(s: Socket, takePeerListOnly: boolean = false) {
    logger.info('Sending handshaking request ...');
    const request: handshake.IRequest = {
      node: this.getLocalPeerDate(),
      payload: this.handler.getPayLoad(),
    };
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    handshake.Writer.request(writer, request);
    const { context, levin } = this.initContext(s, false);
    try {
      const response: any = await levin.invoke(handshake, writer.getBuffer());
      context.version = response.node.version;
      if (
        !Buffer.from(this.networkId).equals(
          Buffer.from(response.node.networkId)
        )
      ) {
        logger.error('Handshaking failed! Network id is mismatched!');
        return false;
      }

      if (
        !this.handleRemotePeerList(
          response.node.localTime,
          response.localPeerList
        )
      ) {
        logger.error('Fail to handle remote local peer list!');
        return false;
      }

      if (takePeerListOnly) {
        logger.info('Handshake take peer list only!');
        return true;
      }

      this.processPayLoad(context, response.payload, true);

      return true;
    } catch (e) {
      logger.error('Fail to handshake with peer!');
      logger.error(e);
      return false;
    }
  }

  private processPayLoad(
    context: P2pConnectionContext,
    data: ICoreSyncData,
    isInitial: boolean
  ) {
    this.handler.processPayLoad(context, data, isInitial);

    const newHeight = this.connectionManager.updateObservedHeight(
      data.currentHeight,
      context,
      this.handler
    );

    if (newHeight !== 0) {
      this.handler.notifyNewHeight(newHeight);
    }

    context.remoteBlockchainHeight = data.currentHeight;
    if (isInitial) {
      this.handler.notifyPeerCount(this.connectionManager.size);
    }
  }

  private handleRemotePeerList(
    localTime: Date,
    peerEntries: IPeerEntry[]
  ): boolean {
    logger.info('Handle remote peer list!');
    for (const pe of peerEntries) {
      logger.info(
        'Peer found: ' + IP.toString(pe.peer.ip) + ':' + pe.peer.port
      );
      logger.info(
        'Last seen: ' + moment(pe.lastSeen).format('YYYY-MM-DD HH:mm:ss')
      );
    }
    const now = Date.now();
    const delta = now - localTime.getTime();
    logger.info('Delta time is ' + delta);
    for (const pe of peerEntries) {
      if (pe.lastSeen.getTime() > localTime.getTime()) {
        logger.error('Found FUTURE peer entry!');
        logger.error(
          'Last seen: ' + moment(pe.lastSeen).format('YYYY-MM-DD HH:mm:ss')
        );
        logger.error(
          'Remote local time: ' +
            moment(localTime).format('YYYY-MM-DD HH:mm:ss')
        );
        return false;
      }
      pe.lastSeen = new Date(pe.lastSeen.getTime() + delta);
    }
    logger.info('Entries Merged!');
    this.pm.merge(peerEntries);
    return true;
  }

  private getLocalPeerDate(): IPeerNodeData {
    return {
      localTime: new Date(),
      myPort: this.p2pConfig.getMyPort(),
      networkId: this.networkId,
      peerId: this.peerId,
      version: Version.CURRENT,
    };
  }
}
