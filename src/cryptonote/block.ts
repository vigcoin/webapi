import { Configuration } from '../config/types';
import { IBlock, IBlockEntry, ITransaction, IBlockHeader } from './types';
import { Transaction } from './transaction';
import { BufferStreamReader } from './serialize/reader';
import { BufferStreamWriter } from './serialize/writer';
import { BaseBuffer, Hash } from '../crypto/types';

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

  public static hash(block: IBlock): Buffer {
    const buffer = BaseBuffer.getBuffer().get();
    const writer = new BufferStreamWriter(buffer);
    this.writeBlockHeader(writer, block.header);
    Transaction.write(writer, block.transaction);
    return buffer;
  }

  public static genesis(conf: Configuration.IBlock): IBlock {
    const genesis = Buffer.from(conf.genesisCoinbaseTxHex, 'hex');
    const reader: BufferStreamReader = new BufferStreamReader(genesis);
    const transaction: ITransaction = Transaction.read(reader);
    return {
      header: {
        version: conf.version,
        nonce: 70,
        timestamp: 0,
        preHash: BaseBuffer.getBuffer().get(),
      },
      transactionHashes: [],
      transaction,
    };
  }

  private block: IBlockEntry;
}
