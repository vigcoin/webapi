import * as assert from 'assert';
import * as path from 'path';
import { Configuration } from '../../../../src/config/types';
import { BufferStreamReader } from '../../../../src/cryptonote/serialize/reader';
import { getBlockChain } from '../../../../src/init/blockchain';
import { getBlockFile } from '../../../../src/util/fs';

import { readFileSync } from 'fs';
import { p2p } from '../../../../src/config/consts';
import { BlockChain } from '../../../../src/cryptonote/block/blockchain';
import { INetwork, IPeer } from '../../../../src/cryptonote/p2p';
import { NSNewBlock } from '../../../../src/cryptonote/protocol/commands/new-block';
import { NSResponseChain } from '../../../../src/cryptonote/protocol/commands/response-chain';
import { getMemoryPool } from '../../../../src/init/mem-pool';
import { data as mainnet } from '../../../../src/init/net-types/mainnet';
import {
  ConnectionState,
  P2pConnectionContext,
} from '../../../../src/p2p/connection';
import { Handler } from '../../../../src/p2p/protocol/handler';
import { IP } from '../../../../src/util/ip';

const network: INetwork = {
  conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
  connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
  handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
  id: 0, // deprecated config id, should be removed in production
  packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
  pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
  sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
};

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
bc.cache();

const memPool = getMemoryPool(dir, mainnet);

const handler = new Handler(bc, memPool);

describe('serialize response chain entry', () => {
  it('should not process response chain entry ahead of the chain', async () => {
    const host = '69.171.73.252';
    const port = 19800;

    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    const socket = await P2pConnectionContext.createConnection(peer, network);

    const context = new P2pConnectionContext(socket);
    const buffer = readFileSync(
      path.resolve(__dirname, './data/response-chain-entry-ahead.bin')
    );
    const request: NSResponseChain.IRequest = NSResponseChain.Reader.request(
      new BufferStreamReader(buffer)
    );

    assert(request.totalHeight === 347329);
    assert(request.startHeight === 2086);
    assert(request.blockHashes.length === 10000);
    assert(!handler.onResponseChain(buffer, context));
    socket.destroy();
  });

  it('should process response chain entry', async () => {
    const host = '69.171.73.252';
    const port = 19800;

    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    const socket = await P2pConnectionContext.createConnection(peer, network);

    const context = new P2pConnectionContext(socket);
    const buffer = readFileSync(
      path.resolve(__dirname, './data/response-chain-entry.bin')
    );
    const request: NSResponseChain.IRequest = NSResponseChain.Reader.request(
      new BufferStreamReader(buffer)
    );

    assert(request.totalHeight === 347922);
    assert(request.startHeight === 0);
    assert(request.blockHashes.length === 10000);
    assert(handler.onResponseChain(buffer, context));
    context.lastResponseHeight = 1;
    context.remoteBlockchainHeight = 2;
    assert(handler.requestMissingObjects([], context));

    context.remoteBlockchainHeight = 10;
    assert(handler.requestMissingObjects([], context));

    context.lastResponseHeight = 11;
    assert(!handler.requestMissingObjects([], context));

    socket.destroy();
  });
});
