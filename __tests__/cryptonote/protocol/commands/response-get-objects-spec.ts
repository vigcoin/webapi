import { BufferStreamReader } from '@vigcoin/serializer';
import { Configuration, INetwork, IPeer } from '@vigcoin/types';
import * as assert from 'assert';
import { readFileSync } from 'fs';
import * as path from 'path';
import { NSResponseGetObjects } from '../../../../src/cryptonote/protocol/commands/response-get-objects';
import { getBlockChain } from '../../../../src/init/blockchain';
import { getBlockFile } from '../../../../src/util/fs';

import { p2p } from '../../../../src/config/consts';
import { BlockChain } from '../../../../src/cryptonote/block/blockchain';
import { getMemoryPool } from '../../../../src/init/mem-pool';
import { data as mainnet } from '../../../../src/init/net-types/mainnet';
import {
  ConnectionState,
  P2pConnectionContext,
} from '../../../../src/p2p/connection';
import { Handler } from '../../../../src/p2p/protocol/handler';
import { IP } from '@vigcoin/util';

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

const memPool = getMemoryPool(dir, mainnet);

const handler = new Handler(bc, memPool);

describe('serialize response get objects', () => {
  it('should read response get objects stock data', async () => {
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
      path.resolve(__dirname, './data/response-get-objects.bin')
    );
    assert(buffer.length === 82963);

    const request: NSResponseGetObjects.IRequest = NSResponseGetObjects.Reader.request(
      new BufferStreamReader(buffer)
    );
    assert(request.currentBlockchainHeight === 346480);
    assert(request.blocks.length === 200);
    assert(!request.txs);
    context.lastResponseHeight = request.currentBlockchainHeight + 1;

    assert(!handler.onResponseObjects(buffer, context));
    assert(context.state === ConnectionState.SHUTDOWN);
    context.lastResponseHeight = request.currentBlockchainHeight;
    assert(handler.onResponseObjects(buffer, context));
    socket.destroy();
  });
});
