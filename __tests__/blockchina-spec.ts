import assert = require('assert');
import * as path from 'path';
import { Configuration } from '../src/config/types';
import { Block } from '../src/cryptonote/block/block';
import { BlockIndex } from '../src/cryptonote/block/block-index';
import { BlockChain } from '../src/cryptonote/block/blockchain';
import { IBlock, IInputBase, IOutputKey } from '../src/cryptonote/types';

let block: IBlock;

describe('read from file', () => {
  const indexFile = path.resolve(__dirname, './vigcoin/blockindexes.dat');
  const blockFile = path.resolve(__dirname, './vigcoin/blocks.dat');
  const chainFile = path.resolve(__dirname, './vigcoin/blockchainindices.dat');
  const cacheFile = path.resolve(__dirname, './vigcoin/blockscache.dat');

  let files: Configuration.IBlockFile = {
    data: blockFile,
    index: indexFile,
    // tslint:disable-next-line:object-literal-sort-keys
    chain: chainFile,
    cache: cacheFile,
  };

  let blockChain: BlockChain = new BlockChain(files);

  test('should init block chain', () => {
    blockChain.init();
  });

  test('should get block entry by height', () => {
    let height = 0;
    let be = blockChain.get(height);
    assert(be.height === height);
    height = 10;
    be = blockChain.get(height);
    assert(be.height === height);
  });
});
