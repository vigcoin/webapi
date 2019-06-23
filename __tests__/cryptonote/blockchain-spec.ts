import assert = require('assert');
import * as path from 'path';
import { Configuration } from '../../src/config/types';
import { BlockChain } from '../../src/cryptonote/block/blockchain';

describe('read from file', () => {
  const indexFile = path.resolve(__dirname, '../vigcoin/blockindexes.dat');
  const blockFile = path.resolve(__dirname, '../vigcoin/blocks.dat');
  const chainFile = path.resolve(__dirname, '../vigcoin/blockchainindices.dat');
  const cacheFile = path.resolve(__dirname, '../vigcoin/blockscache.dat');

  const files: Configuration.IBlockFile = {
    data: blockFile,
    index: indexFile,
    // tslint:disable-next-line:object-literal-sort-keys
    chain: chainFile,
    cache: cacheFile,
  };

  const blockChain: BlockChain = new BlockChain(files);

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
});

describe('read from empty file', () => {
  const indexFile = path.resolve(__dirname, '../vigcoinempty/blockindexes.dat');
  const blockFile = path.resolve(__dirname, '../vigcoinempty/blocks.dat');
  const chainFile = path.resolve(
    __dirname,
    '../vigcoinempty/blockchainindices.dat'
  );
  const cacheFile = path.resolve(__dirname, '../vigcoinempty/blockscache.dat');

  const files: Configuration.IBlockFile = {
    data: blockFile,
    index: indexFile,
    // tslint:disable-next-line:object-literal-sort-keys
    chain: chainFile,
    cache: cacheFile,
  };

  const blockChain: BlockChain = new BlockChain(files);

  test('should init block chain', () => {
    blockChain.init();
  });

  test('should have height', () => {
    assert(blockChain.height === 0);
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
