import { Transaction } from '.';
import { parameters } from '../../config';
import { IHash } from '../../crypto/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { Block } from '../block/block';
import { BufferStreamReader } from '../serialize/reader';
import {
  IBlock,
  IBlockVerificationContext,
  ITransaction,
  ITxVerificationContext,
} from '../types';
import { TransactionPrefix } from './prefix';
import { TransactionValidator } from './validator';

export class TransactionProtocol {
  public static onIncomingBlob(
    context: P2pConnectionContext,
    blockBuffer: Buffer,
    bvc: IBlockVerificationContext,
    keptByBlock: boolean
  ): boolean {
    if (blockBuffer.length > parameters.CRYPTONOTE_MAX_BLOCK_BLOB_SIZE) {
      logger.info(
        'WRONG BLOCK BLOB, too big size ' + blockBuffer.length + ', rejected'
      );
      return false;
    }
    try {
      const block: IBlock = Block.readBlock(
        new BufferStreamReader(blockBuffer)
      );
      context.blockchain.addNew(context, block, bvc);
    } catch (e) {
      logger.info('Failed to parse and validate new block');
      return false;
    }
  }
  public static onIncoming(
    context: P2pConnectionContext,
    tx: Buffer,
    keptByBlock: boolean
  ): boolean {
    if (tx.length >= parameters.CRYPTONOTE_MAX_TX_SIZE) {
      logger.info(
        'WRONG TRANSACTION BLOB, too big size ' + tx.length + ', rejected!'
      );
      return false;
    }
    try {
      return TransactionProtocol.onIncomingSecond(context, tx, keptByBlock);
    } catch (e) {
      logger.info('WRONG TRANSACTION BLOB, Failed to parse, rejected!');
      return false;
    }
  }

  public static onIncomingSecond(
    context: P2pConnectionContext,
    txBuffer: Buffer,
    keptByBlock: boolean
  ): boolean {
    // if (!check_tx_syntax(tx)) {
    //   logger(INFO) << "WRONG TRANSACTION BLOB, Failed to check tx " << txHash << " syntax, rejected";
    //   tvc.m_verifivation_failed = true;
    //   return false;
    // }

    const transaction = Transaction.read(new BufferStreamReader(txBuffer));
    const hash = Transaction.hash(transaction);
    if (!TransactionValidator.checkSematic(transaction)) {
      logger.info(
        'WRONG TRANSACTION BLOB, Failed to check tx ' +
          hash +
          ' semantic, rejected'
      );
      return false;
    }
    return this.addNewTx(context, txBuffer, hash, keptByBlock);
  }

  public static addNewTx(
    context: P2pConnectionContext,
    txBuffer: Buffer,
    hash: IHash,
    keptByBlock: boolean
  ): boolean {
    if (context.blockchain.haveTransaction(hash)) {
      logger.info('tx ' + hash + ' is already in blockchain');
      return true;
    }
    if (context.mempool.haveTx(hash)) {
      logger.info('tx ' + hash + ' is already in already in transaction pool');
      return true;
    }
    const tvc: ITxVerificationContext = {
      addedToPool: false,
      shouldBeRelayed: false,
      txFeeTooSmall: false,
      verifivationFailed: false,
      verifivationImpossible: false,
    };
    return context.mempool.addTxBuffer(context, txBuffer, tvc, keptByBlock);
  }
}
