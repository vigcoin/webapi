import { Socket } from 'net';
import { IPeer, IPeerEntry } from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { logger } from '../logger';
import { ConnectionState, P2pConnectionContext } from './connection';
import { LevinProtocol } from './levin';
import { handshake } from './protocol';
import { Handler } from './protocol/handler';

export class ConnectionManager {
  private connections: Map<string, P2pConnectionContext> = new Map();

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

  public initContext(handler: Handler, s: Socket, inComing: boolean = true) {
    if (inComing) {
      logger.info('New incoming context creating');
    } else {
      logger.info('New outgoing context creating');
    }
    const context = new P2pConnectionContext(s);
    context.isIncoming = inComing;
    const levin = new LevinProtocol(s);
    return this.initLevin(s, context, levin, handler);
  }

  protected initLevin(
    s: Socket,
    context: P2pConnectionContext,
    levin: LevinProtocol,
    handler: Handler
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
      // this.onHandshake(data, context, levin);
    });
    s.on('data', buffer => {
      logger.info('Receiving new data!');
      levin.onIncomingData(new BufferStreamReader(buffer), context, handler);
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
}
