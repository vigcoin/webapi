import { Configuration } from '../config/types';
import { IBlock, IBlockEntry, ITransaction } from './types';
// import { Serializer } from "./serializer";

export class Block {
  public static genesis(conf: Configuration.IBlock) {
    const genesis = Buffer.from(conf.genesisCoinbaseTxHex, 'hex');
    // const transaction: ITransaction = Serializer.parseTransaction(genesis);
    // const blockEntry: IBlockEntry = {
    //   block: {
    //     header: {
    //       version: conf.version,
    //       nonce: 70,
    //       timestamp: 0,
    //       preHash: new Buffer(32)
    //     },
    //     transactionHashes: [],
    //     transaction
    //   }
    // }
  }

  private block: IBlockEntry;
}
