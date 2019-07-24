import assert = require('assert');
import * as path from 'path';
import { Configuration } from '../../src/config/types';
import { BlockChain } from '../../src/cryptonote/block/blockchain';

import { getBlockChain } from '../../src/init/blockchain';
import { data } from '../../src/init/net-types/testnet';
import { getBlockFile } from '../../src/util/fs';

describe('read from file', () => {
  const config: Configuration.ICurrency = {
    block: {
      genesisCoinbaseTxHex: '111',
      version: {
        major: 1,
        minor: 1,
        patch: 1,
      },
    },
    blockFiles: getBlockFile(path.resolve(__dirname, '../vigcoin'), data),
    hardfork: [],
  };

  const blockChain: BlockChain = getBlockChain(config);

  test('should init block chain', () => {
    blockChain.init();
  });

  test('should get block entry by height', () => {
    let height = 0;
    let be = blockChain.get(height);
    assert(be.height === height);
    const hash = BlockChain.hash(be.block);
    const temp = Buffer.from(
      'ab7f4044c541c1ba28b65010ad6191f8f6c981550141fcbca814e7e026627031',
      'hex'
    );
    assert(hash.equals(temp));
    height = 10;
    be = blockChain.get(height);
    assert(be.height === height);
  });

  test('should have height', () => {
    assert(blockChain.height === 49);
  });

  test('should not empty ', () => {
    assert(blockChain.empty() === false);
  });

  test('should get genesis ', () => {
    assert(!!blockChain.genesis().hash);
  });

  test('should get current criculated coins', () => {
    assert(blockChain.circulatedCoins === 2001434200334084);
  });

  test('Should find block by hash', () => {
    const be = blockChain.have(
      Buffer.from(
        'ab7f4044c541c1ba28b65010ad6191f8f6c981550141fcbca814e7e026627031',
        'hex'
      )
    );
    assert(be.height === 0);

    const be1 = blockChain.have(
      Buffer.from(
        '8bcd3a7dac032f0bbca1fb192763f2559c05c1c7cb0b11e0761c9e991dcaec13',
        'hex'
      )
    );
    assert(be1.height === 1);
  });
});

describe('read from empty file', () => {
  const dir = path.resolve(__dirname, '../vigcoinempty');
  const blockFiles = getBlockFile(dir, data);
  const config: Configuration.ICurrency = {
    block: {
      genesisCoinbaseTxHex: '111',
      version: {
        major: 1,
        minor: 1,
        patch: 1,
      },
    },
    blockFiles,
    hardfork: [],
  };

  const blockChain: BlockChain = getBlockChain(config);
  test('should init block chain', () => {
    blockChain.init();
  });

  test('should have height', () => {
    assert(blockChain.height === 0);
  });

  test('should be empty ', () => {
    assert(blockChain.empty() === true);
  });

  test('should have no circulated coins', () => {
    assert(blockChain.circulatedCoins === 0);
  });

  test('Should init genesis', () => {
    const hex =
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101a9a4569f7e10164a32324b2b878ae32d98be0949ce6e0150ba1d7e54d60969e5';

    const blockConf: Configuration.IBlock = {
      genesisCoinbaseTxHex: hex,
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    };
    const genesis = BlockChain.genesis(blockConf);
    const temp = Buffer.from(
      'ab7f4044c541c1ba28b65010ad6191f8f6c981550141fcbca814e7e026627031',
      'hex'
    );
    assert(genesis.hash.equals(temp));
  });
});
