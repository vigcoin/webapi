import assert = require('assert');
import { unlinkSync } from 'fs';
import * as path from 'path';
import { BlockIndex } from '../src/cryptonote/block-index';

let blockIndex: BlockIndex;

describe('test raw block', () => {
  const indexFile = path.resolve(__dirname, './vigcoin/blockindexes.dat');

  test('Should create block index', () => {
    blockIndex = new BlockIndex(indexFile);
    assert(blockIndex.empty());
  });

  test('Should test block index loading', () => {
    blockIndex.init();
    // const items = blockIndex.getOffsets();
    // assert(items.length > 0);
    assert(!blockIndex.empty());
  });
});

describe('test raw block', () => {
  const indexFile = path.resolve(__dirname, './vigcoin/blockindexes1.dat');
  const items = [100, 1122, 2, 1010, 0x7fffffff];

  test('Should create block index', () => {
    blockIndex = new BlockIndex(indexFile);
  });

  test('Should test block index loading', () => {
    blockIndex.init();
    blockIndex.writeHeight(items.length);
    for (const item of items) {
      blockIndex.writeItem(item);
    }
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
