import { Configuration } from '../config/types';
import { IBlock, IBlockEntry, ITransaction } from './types';
import { Transaction } from './transaction';
import { BufferStreamReader } from './serialize/reader';
import { BaseBuffer } from '../crypto/types';

export class Block {
  public static genesis(conf: Configuration.IBlock): IBlock {
    const genesis = Buffer.from(conf.genesisCoinbaseTxHex, 'hex');
    const reader: BufferStreamReader = new BufferStreamReader(genesis);
    const transaction: ITransaction = Transaction.parse(reader);
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
