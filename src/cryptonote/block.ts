import { Configuration } from '../config/types';
import { BaseBuffer, Hash } from '../crypto/types';
import { BufferStreamReader } from './serialize/reader';
import { BufferStreamWriter } from './serialize/writer';
import { Transaction } from './transaction';
import { IBlock, IBlockEntry, IBlockHeader, ITransaction } from './types';
import { getFastHash } from '@vigcoin/neon';
import * as assert from 'assert';

export class Block {
  public static writeBlockHeader(
    writer: BufferStreamWriter,
    header: IBlockHeader
  ) {
    writer.writeVarint(header.version.major);
    writer.writeVarint(header.version.minor);
    writer.writeVarint(header.timestamp);
    writer.write(header.preHash);
    writer.writeUInt32(header.nonce);
  }

  public static merkleHash(hashes: Hash[], start: number, end: number) {
    if (hashes.length === 1) {
      return hashes[0];
    }
    const gap = end - start;
    assert(gap < hashes.length);
    switch (gap) {
      case 0:
        return getFastHash(Buffer.concat([hashes[start], hashes[start]]));
      case 1:
        return getFastHash(Buffer.concat([hashes[start], hashes[start + 1]]));
      default:
        const mid = gap / 2;
        return getFastHash(
          Buffer.concat([
            Block.merkleHash(hashes, start, mid),
            Block.merkleHash(hashes, mid + 1, end),
          ])
        );
    }
  }

  public static hash(block: IBlock): Buffer {
    const writer = new BufferStreamWriter(new Buffer(0));
    this.writeBlockHeader(writer, block.header);
    const hash = Transaction.hash(block.transaction);
    const hashes = [hash];
    for (const h of block.transactionHashes) {
      hashes.push(h);
    }
    const finalHash = Block.merkleHash(hashes, 0, hashes.length - 1);
    return finalHash;
  }

  public static genesis(conf: Configuration.IBlock): IBlock {
    const genesis = Buffer.from(conf.genesisCoinbaseTxHex, 'hex');
    const reader: BufferStreamReader = new BufferStreamReader(genesis);
    const transaction: ITransaction = Transaction.read(reader);
    return {
      header: {
        nonce: 70,
        preHash: BaseBuffer.getBuffer().get(),
        timestamp: 0,
        version: conf.version,
      },
      transaction,
      transactionHashes: [],
    };
  }

  private block: IBlockEntry;
}
