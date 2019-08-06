import * as assert from 'assert';
import * as path from 'path';
import { getConfigByType, getType } from '../../../src/init/cryptonote';
import { data } from '../../../src/init/net-types/testnet';
import { getHandler } from '../../../src/init/p2p';
import { P2PConfig } from '../../../src/p2p/config';
import { getBlockFile, getDefaultAppDir } from '../../../src/util/fs';

describe('test p2p protocol handler', () => {
  const p2pConfig = new P2PConfig();
  const config = getConfigByType(getType(p2pConfig.testnet));

  it('should handler with no blockchain', () => {
    p2pConfig.dataDir = path.resolve(__dirname, '../../vigcoinempty');
    const dir = p2pConfig.dataDir ? p2pConfig.dataDir : getDefaultAppDir();
    const h = getHandler(dir, config);
    assert(h);
    const height = h.height;
    assert(height === 0);
    const payLoad = h.getPayLoad();
    assert(payLoad.currentHeight === 0);
  });

  it('should process payload with no blockchain', () => {
    p2pConfig.dataDir = path.resolve(__dirname, '../../vigcoin');
    const dir = p2pConfig.dataDir ? p2pConfig.dataDir : getDefaultAppDir();
    const h = getHandler(dir, config);
    const height = h.height;
    assert(height === 49);
    const payLoad = h.getPayLoad();
    assert(payLoad.currentHeight === 49);
  });
});
