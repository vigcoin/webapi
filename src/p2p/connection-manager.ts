import { EventEmitter } from 'events';
import { Socket } from 'net';
import {
  ICoreSyncData,
  IPeer,
  IPeerEntry,
  IPeerIDType,
  IPeerNodeData,
  Version,
} from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../cryptonote/serialize/writer';
import { uint8 } from '../cryptonote/types';
import { logger } from '../logger';
import { P2PConfig } from './config';
import { ConnectionState, P2pConnectionContext } from './connection';
import { LevinProtocol } from './levin';
import { PeerManager } from './peer-manager';
import { handshake, ping } from './protocol';
import { Handler } from './protocol/handler';

export class ConnectionManager extends EventEmitter {
  private connections: Map<string, P2pConnectionContext> = new Map();
  private peerId: IPeerIDType;
  private networkId: uint8[];
  private p2pConfig: P2PConfig;

  constructor(peerId: IPeerIDType, networkId: uint8[], p2pConfig: P2PConfig) {
    super();
    this.peerId = peerId;
    this.networkId = networkId;
    this.p2pConfig = p2pConfig;
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

  public updateObservedHeight(
    newHeight: number,
    context: P2pConnectionContext,
    handler: Handler
  ): number {
    let updated = false;
    let observedHeight = handler.observedHeight;
    const height = observedHeight;
    if (newHeight > context.remoteBlockchainHeight) {
      if (newHeight > observedHeight) {
        observedHeight = newHeight;
        updated = true;
      }
    } else {
      // newHeight is less than remote height
      if (newHeight !== context.remoteBlockchainHeight) {
        if (context.remoteBlockchainHeight === observedHeight) {
          // The client switched to alternative chain and had maximum observed height.
          // Need to recalculate max height
          observedHeight = this.recalculateMaxObservedHeight(handler);
          if (height !== observedHeight) {
            updated = true;
          }
        }
      }
    }

    if (updated) {
      return observedHeight;
    }
    return 0;
  }

  public recalculateMaxObservedHeight(handler: Handler): number {
    const peerHeight = this.getHeight();
    const blockHeight = handler.height;
    return peerHeight > blockHeight ? peerHeight : blockHeight;
  }

  get size() {
    return this.connections.size;
  }

  public async handshake(
    handler: Handler,
    pm: PeerManager,
    s: Socket,
    takePeerListOnly: boolean = false
  ) {
    logger.info('Sending handshaking request ...');
    const request: handshake.IRequest = {
      node: this.getLocalPeerData(),
      payload: handler.getPayLoad(),
    };
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    handshake.Writer.request(writer, request);
    const { context, levin } = this.initContext(pm, handler, s, false);
    try {
      const response: any = await levin.invoke(handshake, writer.getBuffer());
      context.version = response.node.version;
      if (
        !pm.handleRemotePeerList(
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

      this.processPayLoad(handler, context, response.payload, true);

      return true;
    } catch (e) {
      logger.error('Fail to handshake with peer!');
      logger.error(e);
      return false;
    }
  }

  public initContext(
    pm: PeerManager,
    handler: Handler,
    s: Socket,
    inComing: boolean = true
  ) {
    if (inComing) {
      logger.info('New incoming context creating');
    } else {
      logger.info('New outgoing context creating');
    }
    const context = new P2pConnectionContext(s);
    context.isIncoming = inComing;
    const levin = new LevinProtocol(s);
    return this.initLevin(s, context, levin, handler, pm);
  }

  protected initLevin(
    s: Socket,
    context: P2pConnectionContext,
    levin: LevinProtocol,
    handler: Handler,
    pm: PeerManager
  ) {
    this.set(context);
    levin.on('state', (state: ConnectionState) => {
      logger.info(
        'Context state changed from ' + context.state + ' to ' + state
      );
      context.state = state;
    });
    levin.on('handshake', (data: handshake.IRequest) => {
      logger.info('Receiving handshaking command!');
      this.onHandshake(pm, handler, data, context, levin);
    });
    s.on('error', e => {
      logger.info('Connection corrupted!');
      logger.error(e);
    });
    s.on('data', buffer => {
      logger.info('Receiving new data!');
      levin.onIncomingData(new BufferStreamReader(buffer), context, handler);
      logger.info('Data processed!');
      if (context.state === ConnectionState.SHUTDOWN) {
        context.stop();
        this.remove(context);
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

  private onHandshake(
    pm: PeerManager,
    handler: Handler,
    data: handshake.IRequest,
    context: P2pConnectionContext,
    levin: LevinProtocol
  ) {
    if (!data.node.peerId.equals(this.peerId) && data.node.myPort !== 0) {
      levin.tryPing(data.node, context);
      // levin.once('ping', (response: ping.IResponse) => {
      //   this.onPing(response, data, context);
      // });
    }
    const response: handshake.IResponse = {
      localPeerList: pm.getLocalPeerList(),
      node: this.getLocalPeerData(),
      payload: handler.getPayLoad(),
    };
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    handshake.Writer.response(writer, response);
    levin.writeResponse(handshake.ID.ID, writer.getBuffer(), true);
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
      // this.pm.appendWhite(pe);
    }
  }

  private processPayLoad(
    handler: Handler,
    context: P2pConnectionContext,
    data: ICoreSyncData,
    isInitial: boolean
  ) {
    handler.processPayLoad(context, data, isInitial);

    const newHeight = this.updateObservedHeight(
      data.currentHeight,
      context,
      handler
    );

    if (newHeight !== 0) {
      handler.notifyNewHeight(newHeight);
    }

    context.remoteBlockchainHeight = data.currentHeight;
    if (isInitial) {
      handler.notifyPeerCount(this.size);
    }
  }

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
