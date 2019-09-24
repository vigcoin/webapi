import { EventEmitter } from 'events';
import { Socket } from 'net';
import {
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
import { handshake, timedsync } from './protocol';
import { Handler } from './protocol/handler';

export class ConnectionManager extends EventEmitter {
  public handler: Handler;
  public peerId: IPeerIDType;

  private connections: Map<string, P2pConnectionContext> = new Map();
  private networkId: uint8[];
  private p2pConfig: P2PConfig;

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
    return handshake.Handler.request(this, peer, pm, s, takePeerListOnly);
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
    context.pm = pm;
    context.cm = this;
    const levin = new LevinProtocol(s);
    return this.initLevin(s, context, levin, pm);
  }

  public initLevin(
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
      await handshake.Handler.onCmd(this, pm, data, context, levin);
    });
    levin.initIncoming(s, context, this.handler);
    return {
      context,
      levin,
    };
  }

  public getLocalPeerData(): IPeerNodeData {
    return {
      localTime: new Date(),
      myPort: this.p2pConfig.getMyPort(),
      networkId: this.networkId,
      peerId: this.peerId,
      version: Version.CURRENT,
    };
  }
}
