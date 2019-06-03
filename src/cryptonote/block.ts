import { Configuration } from '../config/types';
import { BaseBuffer } from '../crypto/types';
import { BufferStreamReader } from './serialize/reader';
import { BufferStreamWriter } from './serialize/writer';
import { Transaction } from './transaction';
import { IBlock, IBlockEntry, IBlockHeader, ITransaction } from './types';

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
    return writer.getBuffer();
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
