import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BlockChain } from '../../../../src/cryptonote/block/blockchain';
import { getBlockChain } from '../../../../src/init/blockchain';
import { LevinState } from '../../../../src/p2p/levin';

import { data as mainnet } from '../../../../src/init/net-types/mainnet';

import { Configuration } from '@vigcoin/types';
import { randomBytes } from 'crypto';
import * as path from 'path';
import { cryptonote } from '../../../../src/config';
import { PROCESSED } from '../../../../src/config/events';
import { NSRequestTXPool } from '../../../../src/cryptonote/protocol/commands/request-tx-pool';
import { getMemoryPool } from '../../../../src/init/mem-pool';
import { getDefaultPeerManager, getP2PServer } from '../../../../src/init/p2p';
import { P2PConfig } from '../../../../src/p2p/config';
import { ConnectionManager } from '../../../../src/p2p/connection-manager';
import { Command } from '../../../../src/p2p/protocol/command';
import { Handler } from '../../../../src/p2p/protocol/handler';
import { getBlockFile } from '../../../../src/util/fs';

const dir = path.resolve(__dirname, '../../../vigcoin');
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

const p2pserver = getP2PServer(dir, mainnet);
const peerId = randomBytes(8);
const networkId = cryptonote.NETWORK_ID;
const p2pConfig = new P2PConfig();
const connectionManager = new ConnectionManager(
  peerId,
  networkId,
  p2pConfig,
  handler
);
const pm = getDefaultPeerManager();

describe('reqest tx pool tests', () => {
  it('should request tx pool with no txs', done => {
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_REQUEST_TX_POOL);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const buffer = Buffer.from([
        0x01,
        0x11,
        0x01,
        0x01,
        0x01,
        0x01,
        0x02,
        0x01,
        0x01,
        0x00,
      ]);
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(NSRequestTXPool, buffer);
    });
  });
});
