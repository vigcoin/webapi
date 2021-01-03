import { Configuration, INetwork, IPeer, IPeerEntry } from '@vigcoin/types';
import * as assert from 'assert';
import { randomBytes } from 'crypto';
import { createConnection, createServer } from 'net';
import * as path from 'path';
import { cryptonote, p2p } from '../../src/config';
import { BlockChain } from '../../src/cryptonote/block/blockchain';
import { getBlockChain } from '../../src/init/blockchain';
import { getConfigByType, getType } from '../../src/init/cryptonote';
import { getMemoryPool } from '../../src/init/mem-pool';
import { data as mainnet } from '../../src/init/net-types/mainnet';
import { getDefaultPeerManager, getHandler } from '../../src/init/p2p';
import { P2PConfig } from '../../src/p2p/config';
import {
  ConnectionState,
  P2pConnectionContext,
} from '../../src/p2p/connection';
import { ConnectionManager } from '../../src/p2p/connection-manager';
import { Handler } from '../../src/p2p/protocol/handler';
import { getBlockFile, getDefaultAppDir } from '../../src/util/fs';
import { IP } from '@vigcoin/util';

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

  const peerId = randomBytes(8);
  const networkId = cryptonote.NETWORK_ID;
  const p2pConfig = new P2PConfig();

  const gDir = path.resolve(__dirname, '../vigcoin');
  const currencyConfig: Configuration.ICCurrency = {
    block: {
      genesisCoinbaseTxHex: mainnet.block.genesisCoinbaseTxHex,
      version: {
        major: 1,
        minor: 1,
        patch: 1,
      },
    },
    blockFiles: getBlockFile(gDir, mainnet),
    checkpoints: [],
    hardforks: [],
  };
  const bc: BlockChain = getBlockChain(currencyConfig);
  bc.init();
  const memPool = getMemoryPool(gDir, mainnet);

  const handler = new Handler(bc, memPool);

  it('should connect to peer with connection manager', async () => {
    jest.setTimeout(10000);
    const config = getConfigByType(getType(p2pConfig.testnet));

    const cm = new ConnectionManager(peerId, networkId, p2pConfig, handler);
    const host = '69.171.73.252';
    const port = 19800;
    const ip = IP.toNumber(host);
    const peer: IPeer = {
      ip,
      port,
    };
    const hostN = '144.202.10.183';
    const ipN = IP.toNumber(host);
    const peerN: IPeer = {
      ip: ipN,
      port,
    };
    let caught = false;
    try {
      const socket = await P2pConnectionContext.createConnection(peer, network);
      const context = new P2pConnectionContext(socket);
      const socket1 = await P2pConnectionContext.createConnection(
        peerN,
        network
      );

      const context1 = new P2pConnectionContext(socket1);

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
      context.cm = cm;
      const reHeight = h.recalculateMaxObservedHeight(context);

      assert(reHeight === 49);

      context.remoteBlockchainHeight = 50;
      const reHeight1 = h.recalculateMaxObservedHeight(context);
      assert(reHeight1 === 50);

      h.observedHeight = 10;

      assert(h.updateObservedHeight(100, context) === 100);
      assert(h.updateObservedHeight(20, context) === 0);
      h.observedHeight = 60;
      assert(h.updateObservedHeight(51, context) === 0);
      h.observedHeight = 50;
      assert(h.updateObservedHeight(49, context) === 0);
      assert(h.updateObservedHeight(50, context) === 0);
      cm.set(context1);

      context1.remoteBlockchainHeight = 1000;
      assert(h.updateObservedHeight(49, context) === 1000);
      cm.stop();
      cm.remove(context);
      cm.remove(context1);
    } catch (e) {
      // console.log(e);
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

  it('should init context and emit state change', done => {
    const cm = new ConnectionManager(peerId, networkId, p2pConfig, handler);
    const pm = getDefaultPeerManager();
    const server = createServer(socket => {
      const { levin, context } = cm.initContext(pm, socket);
      levin.on('state', () => {
        assert(context.state === ConnectionState.BEFORE_HANDSHAKE);
        client.destroy();
        server.close();
        done();
      });
      levin.emit('state', ConnectionState.BEFORE_HANDSHAKE);
    });
    const port = Math.floor(Math.random() * 1000) + 10000;
    server.listen(port);
    const client = createConnection({ port }, () => {
      cm.initContext(pm, client, false);
      client.write(Buffer.from([0, 1, 2, 3]));
    });
  });

  it('should init connect with handshake only', async () => {
    jest.setTimeout(10000);
    const cm = new ConnectionManager(peerId, networkId, p2pConfig, handler);
    const host = '69.171.73.252';
    const port = 19800;
    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    const pm = getDefaultPeerManager();
    await cm.connect(network, pm, peer, true);
    await cm.stop();
    assert(pm.white.length === 0);
  });

  it('should init connect not only handshake', async () => {
    jest.setTimeout(10000);
    const cm = new ConnectionManager(peerId, networkId, p2pConfig, handler);
    const host = '69.171.73.252';
    const port = 19800;
    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    const pm = getDefaultPeerManager();
    await cm.connect(network, pm, peer, false);
    await cm.stop();
    assert(pm.white.length > 0);
  });

  it('should send timed sync request', async () => {
    jest.setTimeout(10000);
    const cm = new ConnectionManager(peerId, networkId, p2pConfig, handler);
    const host = '69.171.73.252';
    const port = 19800;
    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    const pm = getDefaultPeerManager();
    const { levin, context } = await cm.connect(network, pm, peer, false);
    cm.timedsync();
    await cm.stop();
    assert(pm.white.length > 0);
  });
});
