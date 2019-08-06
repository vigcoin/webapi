import * as assert from 'assert';
import { randomBytes } from 'crypto';
import { createConnection, createServer } from 'net';
import * as path from 'path';
import { cryptonote } from '../../../src/config';
import { Configuration } from '../../../src/config/types';
import { BlockChain } from '../../../src/cryptonote/block/blockchain';
import { getBlockChain } from '../../../src/init/blockchain';
import { getConfigByType, getType } from '../../../src/init/cryptonote';
import { data as mainnet } from '../../../src/init/net-types/mainnet';
import { data as testnet } from '../../../src/init/net-types/testnet';
import { getDefaultPeerManager } from '../../../src/init/p2p';
import { P2PConfig } from '../../../src/p2p/config';
import { ConnectionManager } from '../../../src/p2p/connection-manager';
import { Handler } from '../../../src/p2p/protocol/handler';
import { getBlockFile, getDefaultAppDir } from '../../../src/util/fs';
import { IP } from '../../../src/util/ip';

const peerId = randomBytes(8);
const networkId = cryptonote.NETWORK_ID;
const p2pConfig = new P2PConfig();

const cm = new ConnectionManager(peerId, networkId, p2pConfig);

const dir = path.resolve(__dirname, '../../vigcoin');
const config: Configuration.ICurrency = {
  block: {
    genesisCoinbaseTxHex: '111',
    version: {
      major: 1,
      minor: 1,
      patch: 1,
    },
  },
  blockFiles: getBlockFile(dir, mainnet),
  hardfork: [],
};
const bc: BlockChain = getBlockChain(config);
bc.init();

const handler = new Handler(bc);
const pm = getDefaultPeerManager();
const pm1 = getDefaultPeerManager();

describe('test p2p handshake', () => {
  it('should handshake to just take peerlist', done => {
    jest.setTimeout(10000);
    assert(pm.gray.length === 0);
    assert(pm.white.length === 0);
    const { ip, port } = mainnet.seeds[0];
    const client = createConnection(
      { host: IP.toString(ip), port },
      async () => {
        assert(await cm.handshake(handler, pm, client, true));
        assert(pm.gray.length > 0);
        assert(pm.white.length === 0);
        client.destroy();
        done();
      }
    );
  });

  it('should handshake to just take peerlist with local p2p server', done => {
    jest.setTimeout(10000);
    let processed = false;
    const server = createServer(socket => {
      const { levin } = cm.initContext(pm, handler, socket, true);
      levin.on('processed', message => {
        assert(message === 'handshake');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      assert(await cm.handshake(handler, pm1, client, true));
      assert(processed);
      assert(pm1.gray.length > 0);
      client.destroy();
      server.close();
      done();
    });
  });
});
