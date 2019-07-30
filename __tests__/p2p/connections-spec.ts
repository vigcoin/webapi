import * as assert from 'assert';
import { p2p } from '../../src/config';
import { INetwork, IPeer } from '../../src/p2p';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { IP } from '../../src/util/ip';
import { ConnectionManager } from '../../src/p2p/connection-manager';
import { IPeerEntry } from '../../src/cryptonote/p2p';
import { randomBytes } from 'crypto';

describe('test connections', () => {
  const network: INetwork = {
    conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
    connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
    handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
    id: 0, // deprecated config id, should be removed in production
    packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
    pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
    sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
  };

  it('should connect to peer', async () => {
    const cm = new ConnectionManager();
    const host = '69.171.73.252';
    const port = 19800;
    const ip = IP.toNumber(host);
    const peer: IPeer = {
      ip,
      port,
    };
    let caught = false;
    try {
      const socket = await P2pConnectionContext.createConnection(peer, network);
      const context = new P2pConnectionContext(socket);

      cm.set(context);
      const height = cm.getHeight();
      assert(height === 0);
      assert(cm.size === 1);

      context.remoteBlockchainHeight = 1;

      assert(cm.getHeight() === 1);

      const count = cm.getOutGoingConnectionCount();
      assert(cm.isPeerConnected(peer));
      const id = randomBytes(32);
      const pe: IPeerEntry = {
        id,
        lastSeen: new Date(),
        peer,
      };
      assert(cm.isPeerUsed(pe, randomBytes(32)));
      assert(cm.isPeerUsed(pe, id));

      const pe1: IPeerEntry = {
        id: randomBytes(32),
        lastSeen: new Date(),
        peer: {
          ip,
          port: 1024,
        },
      };

      assert(!cm.isPeerUsed(pe1, id));
      const pe2: IPeerEntry = {
        id: randomBytes(32),
        lastSeen: new Date(),
        peer: {
          ip: IP.toNumber('127.0.0.1'),
          port,
        },
      };

      assert(!cm.isPeerUsed(pe2, id));

      assert(context.isIncoming === false);

      // context.isIncoming = true;

      // assert(!cm.isPeerUsed(pe, id));

      socket.destroy();
    } catch (e) {
      caught = true;
    }
    assert(!caught);
  });

  it('should connect to peer', async () => {
    // const host = '250.167.157.123';
    const host = '127.0.0.1';
    const port = 19800;
    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    let caught = false;
    try {
      const socket = await P2pConnectionContext.createConnection(peer, network);
    } catch (e) {
      caught = true;
    }
    assert(caught);
  });

  it('should connect to peer', async () => {
    jest.setTimeout(10000);
    const host = '101.71.100.123';
    const port = 19800;
    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    let caught = false;
    try {
      const socket = await P2pConnectionContext.createConnection(peer, network);
    } catch (e) {
      caught = true;
    }
    assert(caught);
  });
});
