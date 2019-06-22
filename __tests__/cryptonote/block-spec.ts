import assert = require('assert');
import * as path from 'path';
import { Configuration } from '../../src/config/types';
import { Block } from '../../src/cryptonote/block/block';
import { BlockIndex } from '../../src/cryptonote/block/block-index';
import { IBlock, IInputBase, IOutputKey } from '../../src/cryptonote/types';

let block: IBlock;

describe('test raw block', () => {
  const hex =
    '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101a9a4569f7e10164a32324b2b878ae32d98be0949ce6e0150ba1d7e54d60969e5';
  test('Should init genesis', () => {
    const blockConf: Configuration.IBlock = {
      genesisCoinbaseTxHex: hex,
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    };
    block = Block.genesis(blockConf);

    expect(block.header.nonce === 70).toBeTruthy();
    expect(block.header.version.major === 1).toBeTruthy();
    expect(block.header.version.minor === 0).toBeTruthy();
    expect(block.header.version.patch === 0).toBeTruthy();
    expect(block.header.timestamp === 0).toBeTruthy();
    expect(block.header.preHash.equals(new Buffer(32))).toBeTruthy();
    expect(block.transactionHashes.length === 0).toBeTruthy();

    expect(block.transaction.prefix.version === 1).toBeTruthy();
    expect(block.transaction.prefix.unlockTime === 60).toBeTruthy();
    expect(block.transaction.prefix.outputs[0].amount === 1).toBeTruthy();
    const output = block.transaction.prefix.outputs[0].target as IOutputKey;
    expect(output.key.length === 32).toBeTruthy();
    expect(output.key[0] === 155).toBeTruthy();
    expect(output.key[31] === 113).toBeTruthy();
    expect(block.transaction.prefix.outputs.length === 1).toBeTruthy();
    expect(block.transaction.prefix.inputs.length === 1).toBeTruthy();
    const input: IInputBase = block.transaction.prefix.inputs[0]
      .target as IInputBase;
    expect(input.blockIndex === 0).toBeTruthy();
    expect(
      block.transaction.prefix.extra.equals(
        new Buffer(
          [
            0xe5,
            0x69,
            0x09,
            0xd6,
            0x54,
            0x7e,
            0x1d,
            0xba,
            0x50,
            0x01,
            0x6e,
            0xce,
            0x49,
            0x09,
            0xbe,
            0x98,
            0x2d,
            0xe3,
            0x8a,
            0x87,
            0x2b,
            0x4b,
            0x32,
            0x32,
            0x4a,
            0x16,
            0x10,
            0x7e,
            0x9f,
            0x56,
            0xa4,
            0xa9,
            0x01,
          ].reverse()
        )
      )
    ).toBeTruthy();
  });

  test('Should get block hash', () => {
    const hash = Block.hash(block);
    const temp = Buffer.from(
      'ab7f4044c541c1ba28b65010ad6191f8f6c981550141fcbca814e7e026627031',
      'hex'
    );
    assert(hash.equals(temp));
  });
});

describe('read from file', () => {
  const indexFile = path.resolve(__dirname, '../vigcoin/blockindexes.dat');
  const blockFile = path.resolve(__dirname, '../vigcoin/blocks.dat');
  let blockIndex: BlockIndex;
  // tslint:disable-next-line:no-shadowed-variable
  let block: Block;

  test('should init index & block', () => {
    blockIndex = new BlockIndex(indexFile);
    blockIndex.init();
    block = new Block(blockFile);
  });

  test('should read items', () => {
    const items = blockIndex.getOffsets();
    let offset = 0;
    for (const item of items) {
      const blockItem = block.read(offset, item);
      offset += item;
    }
  });
});
