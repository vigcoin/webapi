import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BlockChain } from '../../../../src/cryptonote/block/blockchain';
import { getBlockChain } from '../../../../src/init/blockchain';
import { LevinState } from '../../../../src/p2p/levin';

import { data as mainnet } from '../../../../src/init/net-types/mainnet';

import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import * as path from 'path';
import { cryptonote } from '../../../../src/config';
import { PROCESSED } from '../../../../src/config/events';
import { Configuration } from '../../../../src/config/types';
import { NSResponseGetObjects } from '../../../../src/cryptonote/protocol/commands/response-get-objects';
import { getMemoryPool } from '../../../../src/init/mem-pool';
import { getDefaultPeerManager, getP2PServer } from '../../../../src/init/p2p';
import { P2PConfig } from '../../../../src/p2p/config';
import { ConnectionState } from '../../../../src/p2p/connection';
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
  hardfork: [],
};
const bc: BlockChain = getBlockChain(config);
bc.init();

const memPool = getMemoryPool(dir, mainnet);

const handler = new Handler(bc, memPool);

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

describe('response get objects', () => {
  it('should handle response get objects', done => {
    const server = createServer(socket => {
      const { levin, context } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      context.state = ConnectionState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_RESPONSE_GET_OBJECTS);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const buffer = readFileSync(
        path.resolve(__dirname, './data/response-get-objects.bin')
      );
      assert(buffer.length === 187);
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(NSResponseGetObjects, buffer);
    });
  });

  it('should handle response get objects 1', done => {
    jest.setTimeout(10000);
    const server = createServer(socket => {
      const { levin, context } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      context.state = ConnectionState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_RESPONSE_GET_OBJECTS);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const buffer = readFileSync(
        path.resolve(
          __dirname,
          '../../../cryptonote/protocol/commands/data/response-get-objects.bin'
        )
      );
      assert(buffer.length === 82963);
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(NSResponseGetObjects, buffer);
    });
  });
});
