import { EventEmitter } from 'events';
import { Socket } from 'net';
import { BLOCK_HEIGHT_UPDATED, TIMED_SYNC } from '../config/events';
import {
  ICoreSyncData,
  INetwork,
  IPeer,
  IPeerEntry,
  IPeerIDType,
  IPeerNodeData,
  Version,
} from '../cryptonote/p2p';
import { uint8 } from '../cryptonote/types';
import { logger } from '../logger';
import { P2PConfig } from './config';
import { ConnectionState, P2pConnectionContext } from './connection';
import { LevinProtocol } from './levin';
import { PeerManager } from './peer-manager';
import { handshake, ping, timedsync } from './protocol';
import { Handler } from './protocol/handler';

export class ConnectionManager extends EventEmitter {
  // public observedHeight: number = 0;

  private connections: Map<string, P2pConnectionContext> = new Map();
  private peerId: IPeerIDType;
  private networkId: uint8[];
  private p2pConfig: P2PConfig;
  private handler: Handler;

  constructor(
    peerId: IPeerIDType,
    networkId: uint8[],
    p2pConfig: P2PConfig,
    handler: Handler
  ) {
    super();
    this.peerId = peerId;
    this.networkId = networkId;
    this.p2pConfig = p2pConfig;
    this.handler = handler;
    handler.setCM(this);
  }

  public stop() {
    logger.info('Stopping connections...');
    this.connections.forEach((context: P2pConnectionContext) => {
      context.stop();
    });
    logger.info('Connections stopped!');
  }

  public set(context: P2pConnectionContext) {
    this.connections.set(context.id.toString('hex'), context);
  }

  public remove(context: P2pConnectionContext) {
    this.connections.delete(context.id.toString('hex'));
  }

  public getOutGoingConnectionCount(): number {
    let count = 0;
    this.connections.forEach((context: P2pConnectionContext) => {
      if (!context.isIncoming) {
        count++;
      }
    });
    return count;
  }

  public isPeerConnected(peer: IPeer) {
    let connected = false;
    this.connections.forEach((context: P2pConnectionContext) => {
      if (context.isIncoming) {
        return;
      }
      if (peer.ip !== context.ip) {
        return;
      }

      if (peer.port !== context.port) {
        return;
      }
      connected = true;
    });
    return connected;
  }

  public isPeerUsed(pe: IPeerEntry, peerId: Buffer): boolean {
    if (pe.id.equals(peerId)) {
      return true;
    }
    let used = false;
    this.connections.forEach((context: P2pConnectionContext) => {
      if (context.peerId.equals(pe.id)) {
        used = true;
        return;
      }
      if (context.isIncoming) {
        return;
      }
      if (pe.peer.ip !== context.ip) {
        return;
      }
      if (pe.peer.port !== context.port) {
        return;
      }
      used = true;
    });
    return used;
  }

  public getHeight() {
    let height = 0;
    this.connections.forEach((connection: P2pConnectionContext) => {
      if (connection.remoteBlockchainHeight > height) {
        height = connection.remoteBlockchainHeight;
      }
    });
    return height;
  }

  get size() {
    return this.connections.size;
  }

  // try_to_connect_and_handshake_with_new_peer
  public async connect(
    network: INetwork,
    pm: PeerManager,
    peer: IPeer,
    takePeerListOnly: boolean
  ) {
    const s = await P2pConnectionContext.createConnection(peer, network);
    return this.handshake(peer, pm, s, takePeerListOnly);
  }

  // Commands

  // HANDSHAKE
  // request
  public async handshake(
    peer: IPeer,
    pm: PeerManager,
    s: Socket,
    takePeerListOnly: boolean = false
  ) {
    const buffer = handshake.Handler.getBuffer(
      this.getLocalPeerData(),
      this.handler.getPayLoad()
    );
    const { context, levin } = this.initContext(pm, s, false);
    const response: any = await levin.invoke(handshake, buffer);
    context.version = response.node.version;
    logger.info('Handling peer list');
    pm.handleRemotePeerList(response.node.localTime, response.localPeerList);
    if (takePeerListOnly) {
      logger.info('Handshake take peer list only!');
      return { context, levin };
    }
    logger.info('Processing pay load!');
    this.handler.processPayLoad(context, response.payload, true);
    logger.info('Pay load processed!');
    context.peerId = response.node.peerId;
    const pe: IPeerEntry = {
      id: context.peerId,
      lastSeen: new Date(),
      peer,
    };
    pm.appendWhite(pe);
    if (context.peerId.equals(this.peerId)) {
      logger.info('Connection to self detected, dropping connection!');
      s.destroy();
      s = null;
      this.remove(context);
    }
    levin.on(TIMED_SYNC, (resp: timedsync.IResponse) => {
      timedsync.Handler.onMainTimedSync(resp, context, pm, this.handler, peer);
    });
    return { context, levin };
  }

  // response
  public async onHandshake(
    pm: PeerManager,
    data: handshake.IRequest,
    context: P2pConnectionContext,
    levin: LevinProtocol
  ) {
    logger.info('on connection manager handshake!');
    if (!data.node.peerId.equals(this.peerId) && data.node.myPort !== 0) {
      const { success, response: res } = await ping.Handler.try(
        data.node,
        context,
        levin
      );
      if (success) {
        ping.Handler.onTry(res as ping.IResponse, data, context, pm);
      }
    }
    handshake.Handler.sendResponse(
      levin,
      pm.getLocalPeerList(),
      this.getLocalPeerData(),
      this.handler.getPayLoad()
    );
  }

  // TIMEDSYNC
  // request
  public async timedsync() {
    const buffer = timedsync.Handler.getBuffer(this.handler.getPayLoad());
    logger.info('Getting connections timedsync');
    this.connections.forEach((context: P2pConnectionContext) => {
      if (context.peerId.length) {
        logger.info('Context peerId found: ' + context.peerId.toString('hex'));
      } else {
        logger.info('Context peerId not initialized!');
      }
      if (context.peerId.length) {
        logger.info(
          'Context state: ' + P2pConnectionContext.state2String(context.state)
        );
        switch (context.state) {
          case ConnectionState.NORMAL:
          case ConnectionState.IDLE:
            logger.info('timesync request sent');
            context.socket.write(buffer);
            break;
        }
      }
    });
  }

  // connectionHandler
  public initContext(pm: PeerManager, s: Socket, inComing: boolean = true) {
    if (inComing) {
      logger.info('New incoming context creating');
    } else {
      logger.info('New outgoing context creating');
    }
    const context = new P2pConnectionContext(s);
    context.isIncoming = inComing;
    const levin = new LevinProtocol(s);
    return this.initLevin(s, context, levin, pm);
  }

  protected initLevin(
    s: Socket,
    context: P2pConnectionContext,
    levin: LevinProtocol,
    pm: PeerManager
  ) {
    this.set(context);
    context.on('state', (state: ConnectionState) => {
      switch (state) {
        case ConnectionState.SYNC_REQURIED:
          break;
        case ConnectionState.SYNCHRONIZING:
          this.handler.startSync(context);
          break;
      }
    });
    levin.on('state', (state: ConnectionState) => {
      logger.info(
        'Context state changed from ' + context.state + ' to ' + state
      );
      context.state = state;
      if (context.state === ConnectionState.SHUTDOWN) {
        context.stop();
        this.remove(context);
      }
    });
    levin.on('handshake', async (data: handshake.IRequest) => {
      logger.info('Receiving handshaking command!');
      await this.onHandshake(pm, data, context, levin);
    });
    levin.initIncoming(s, context, this.handler);

    return {
      context,
      levin,
    };
  }

  // private processPayLoad(
  //   context: P2pConnectionContext,
  //   data: ICoreSyncData,
  //   isInitial: boolean
  // ) {
  //   this.handler.processPayLoad(context, data, isInitial);

  //   // this.updateObservedHeight(data.currentHeight, context);

  //   // context.remoteBlockchainHeight = data.currentHeight;
  //   if (isInitial) {
  //     this.handler.notifyPeerCount(this.size);
  //   }
  // }

  private getLocalPeerData(): IPeerNodeData {
    return {
      localTime: new Date(),
      myPort: this.p2pConfig.getMyPort(),
      networkId: this.networkId,
      peerId: this.peerId,
      version: Version.CURRENT,
    };
  }
}
