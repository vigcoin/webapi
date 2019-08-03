import * as assert from 'assert';
import { randomBytes } from 'crypto';
import * as path from 'path';
import { p2p } from '../../src/config';
import { IPeerEntry } from '../../src/cryptonote/p2p';
import { getConfigByType, getType } from '../../src/init/cryptonote';
import { getHandler } from '../../src/init/p2p';
import { INetwork, IPeer } from '../../src/p2p';
import { P2PConfig } from '../../src/p2p/config';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { ConnectionManager } from '../../src/p2p/connection-manager';
import { getDefaultAppDir } from '../../src/util/fs';
import { IP } from '../../src/util/ip';

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

  it('should connect to peer with connection manager', async () => {
    const p2pConfig = new P2PConfig();
    const config = getConfigByType(getType(p2pConfig.testnet));

    const cm = new ConnectionManager();
    const host = '69.171.73.252';
    const port = 19800;
    const ip = IP.toNumber(host);
    const peer: IPeer = {
      ip,
      port,
    };
    const hostN = '39.108.160.252';
    const ipN = IP.toNumber(host);
    const peerN: IPeer = {
      ip: ipN,
      port,
    };
    let caught = false;
    try {
      const socket = await P2pConnectionContext.createConnection(peer, network);
      const context = new P2pConnectionContext(socket);
      // const socket1 = await P2pConnectionContext.createConnection(
      //   peerN,
      //   network
      // );

      // const context1 = new P2pConnectionContext(socket1);

      cm.set(context);
      // cm.set(context1);
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

      const peer1 = {
        ip,
        port: 1024,
      };
      const pe1: IPeerEntry = {
        id: randomBytes(32),
        lastSeen: new Date(),
        peer: peer1,
      };

      assert(!cm.isPeerConnected(peer1));

      assert(!cm.isPeerUsed(pe1, id));

      const peer2 = {
        ip: IP.toNumber('127.0.0.1'),
        port,
      };
      const pe2: IPeerEntry = {
        id: randomBytes(32),
        lastSeen: new Date(),
        peer: peer2,
      };

      assert(!cm.isPeerUsed(pe2, id));
      assert(!cm.isPeerConnected(peer2));

      assert(context.isIncoming === false);

      context.isIncoming = true;

      assert(!cm.isPeerConnected(peer));

      assert(!cm.isPeerUsed(pe2, id));

      pe2.id = context.peerId;
      cm.getOutGoingConnectionCount();

      assert(cm.isPeerUsed(pe2, id));

      p2pConfig.dataDir = path.resolve(__dirname, '../vigcoin');
      const dir = p2pConfig.dataDir ? p2pConfig.dataDir : getDefaultAppDir();
      const h = getHandler(dir, config);
      const reHeight = cm.recalculateMaxObservedHeight(h);

      assert(reHeight === 49);

      context.remoteBlockchainHeight = 50;
      const reHeight1 = cm.recalculateMaxObservedHeight(h);
      assert(reHeight1 === 50);

      h.observedHeight = 10;

      assert(cm.updateObservedHeight(100, context, h) === 100);
      assert(cm.updateObservedHeight(20, context, h) === 0);
      h.observedHeight = 60;
      assert(cm.updateObservedHeight(51, context, h) === 0);
      h.observedHeight = 50;
      assert(cm.updateObservedHeight(49, context, h) === 0);
      // context1.remoteBlockchainHeight = 1000;
      // assert(cm.updateObservedHeight(49, context, h) === 1000);
      cm.remove(context);
      socket.destroy();
    } catch (e) {
      caught = true;
    }
    assert(!caught);
  });

  it('should connect to peer', async () => {
    // const host = '250.167.157.123';
    const host = '127.0.0.1';
    const port = Math.floor(Math.random() * 1000) + 10000;
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
