import { Configuration, IPeer } from '@vigcoin/types';
import { IP } from '@vigcoin/util';
import * as assert from 'assert';
import { randomBytes } from 'crypto';
import { createConnection, createServer } from 'net';
import * as path from 'path';
import { cryptonote } from '../../../src/config';
import { PEERS_COUNT_UPDATED } from '../../../src/config/events';
import { BlockChain } from '../../../src/cryptonote/block/blockchain';
import { getBlockChain } from '../../../src/init/blockchain';
import { getMemoryPool } from '../../../src/init/mem-pool';
import { data as mainnet } from '../../../src/init/net-types/mainnet';
import { data as testnet } from '../../../src/init/net-types/testnet';
import { getDefaultPeerManager, getP2PServer } from '../../../src/init/p2p';
import { P2PConfig } from '../../../src/p2p/config';
import { ConnectionManager } from '../../../src/p2p/connection-manager';
import { handshake } from '../../../src/p2p/protocol';
import { Handler } from '../../../src/p2p/protocol/handler';
import { getBlockFile } from '../../../src/util/fs';

const peerId = randomBytes(8);
const networkId = cryptonote.NETWORK_ID;
const p2pConfig = new P2PConfig();

const dir = path.resolve(__dirname, '../../vigcoin');
const p2pFile = path.resolve(__dirname, '../../vigcoin/p2pstate.bin');

const config: Configuration.ICCurrency = {
  block: {
    genesisCoinbaseTxHex: '111',
    version: {
      major: 1,
      minor: 1,
      patch: 1,
    },
  },
  blockFiles: getBlockFile(dir, mainnet),
  checkpoints: [],
  hardforks: [],
};
const bc: BlockChain = getBlockChain(config);
bc.init();

const memPool = getMemoryPool(dir, mainnet);

const handler = new Handler(bc, memPool);

const cm = new ConnectionManager(peerId, networkId, p2pConfig, handler);

describe('test p2p handshake', () => {
  it('should handshake to just take peerlist', done => {
    const pm = getDefaultPeerManager();
    jest.setTimeout(10000);
    assert(pm.gray.length === 0);
    assert(pm.white.length === 0);
    const peer: IPeer = mainnet.seeds[0];
    const { ip, port } = peer;
    const client = createConnection(
      { host: IP.toString(ip), port },
      async () => {
        assert(await handshake.Handler.request(cm, peer, pm, client, true));
        assert(pm.gray.length > 0);
        assert(pm.white.length === 0);
        client.destroy();
        done();
      }
    );
  });
  it('should handshake with not just peerlist', done => {
    const pm1 = getDefaultPeerManager();
    jest.setTimeout(10000);
    assert(pm1.gray.length === 0);
    assert(pm1.white.length === 0);
    const peer: IPeer = mainnet.seeds[0];
    const { ip, port } = peer;
    function close() {
      client.destroy();
      done();
    }
    const client = createConnection(
      { host: IP.toString(ip), port },
      async () => {
        handler.on(PEERS_COUNT_UPDATED, count => {
          close();
        });
        assert(await handshake.Handler.request(cm, peer, pm1, client, false));
        assert(pm1.gray.length > 0);
        assert(pm1.white.length === 1);
      }
    );
  });

  it('should handshake to just take peerlist with local p2p server', done => {
    const p2pServer = getP2PServer(dir, testnet);
    p2pServer.serializeFile = p2pFile;

    p2pServer.readStore();

    const pm2 = p2pServer.pm;

    assert(pm2.gray.length > 0);

    jest.setTimeout(10000);
    let processed = false;
    const server = createServer(socket => {
      const { levin } = cm.initContext(pm2, socket, true);
      levin.on('processed', message => {
        assert(message === 'handshake');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const peer = { port, ip: IP.toNumber('127.0.0.1') };
      assert(await handshake.Handler.request(cm, peer, pm2, client, true));
      assert(processed);
      assert(pm2.gray.length >= 0);
      client.destroy();
      server.close();
      done();
    });
  });

  it('should handshake to just take peerlist with local p2p server', done => {
    const p2pServer = getP2PServer(dir, testnet);

    p2pServer.serializeFile = p2pFile;

    p2pServer.readStore();

    const pm2 = p2pServer.pm;

    assert(pm2.gray.length > 0);

    jest.setTimeout(10000);
    let processed = false;
    const server = createServer(socket => {
      const { levin } = cm.initContext(pm2, socket);
      levin.on('processed', message => {
        assert(message === 'handshake');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const peer = { port, ip: IP.toNumber('127.0.0.1') };
      assert(await handshake.Handler.request(cm, peer, pm2, client));
      assert(processed);
      assert(pm2.gray.length >= 0);
      client.destroy();
      server.close();
      done();
    });
  });
});
