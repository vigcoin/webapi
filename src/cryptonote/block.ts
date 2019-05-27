import { Configuration } from "../config/types";
import { IBlock, IBlockEntry, ITransaction } from "./types";
import { Serializer } from "./serializer";

export class Block {

  public static genesis(conf: Configuration.IBlock) {

    const genesis = Buffer.from(conf.genesisCoinbaseTxHex, 'hex');
    const transaction: ITransaction = Serializer.parseTransaction(genesis);
    const blockEntry: IBlockEntry = {
      block: {
        header: {
          version: conf.version,
          nonce: 70,
          timestamp: 0,
          preHash: new Buffer(32)
        },
        transactionHashes: [],
        transaction
      }
    }

    // block_t block = boost:: value_initialized<block_t>();

    // std:: string genesisCoinbaseTxHex = conf.block.genesis_coinbase_tx_hex;
    // binary_array_t minerTxBlob;

    // bool r =
    //   hex:: fromString(genesisCoinbaseTxHex, minerTxBlob) &&
    //     BinaryArray:: from(block.baseTransaction, minerTxBlob);

    // if (!r) {
    //   throw std:: runtime_error("Failed to create genesis hex!");
    // }

    // block.majorVersion = conf.block.version.major;
    // block.minorVersion = conf.block.version.minor;
    // block.timestamp = 0;
    // block.nonce = 70;
  }

  private block: IBlockEntry;
}