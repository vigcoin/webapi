import assert = require('assert');
import { unlinkSync } from 'fs';
import * as path from 'path';
import { BlockIndex } from '../../src/cryptonote/block/block-index';

let blockIndex: BlockIndex;

describe('test block indexes', () => {
  const indexFile = path.resolve(__dirname, '../vigcoin/blockindexes.dat');

  test('Should create block index', () => {
    blockIndex = new BlockIndex(indexFile);
    assert(blockIndex.empty());
  });

  test('Should test block index loading', () => {
    blockIndex.init();
    assert(!blockIndex.empty());
  });
});

describe('test raw block', () => {
  const indexFile = path.resolve(__dirname, '../vigcoin/blockindexes1.dat');
  const items = [100, 1122, 2, 1010, 0x7fffffff];

  test('Should create block index', () => {
    blockIndex = new BlockIndex(indexFile);
  });

  test('Should test block index saving', () => {
    blockIndex.init();
    blockIndex.writeItems(items);
    blockIndex.deinit();
  });

  test('Should test block index loading', () => {
    const b = new BlockIndex(indexFile);
    b.init();
    const items1 = b.getOffsets();
    assert(items.length === items1.length);
    for (let i = 0; i < items.length; i++) {
      assert(items[i] === items1[i]);
    }
  });

  test('Should remove block index', () => {
    unlinkSync(indexFile);
  });
});
