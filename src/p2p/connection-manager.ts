import { IPeer, IPeerEntry } from '../cryptonote/p2p';
import { logger } from '../logger';
import { P2pConnectionContext } from './connection';

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

  get size() {
    return this.connections.size;
  }
}
