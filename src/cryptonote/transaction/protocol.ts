import { Transaction } from '.';
import { parameters } from '../../config';
import { IHash } from '../../crypto/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { BufferStreamReader } from '../serialize/reader';
import { ITransaction } from '../types';
import { TransactionPrefix } from './prefix';
import { TransactionValidator } from './validator';

export class TransactionProtocol {
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
      const transaction = Transaction.read(new BufferStreamReader(tx));
      const hash = Transaction.hash(transaction);
      const preHash = TransactionPrefix.hash(transaction.prefix);

      return TransactionProtocol.onIncomingSecond(
        context,
        transaction,
        hash,
        preHash,
        keptByBlock
      );
    } catch (e) {
      logger.info('WRONG TRANSACTION BLOB, Failed to parse, rejected!');
      return false;
    }
  }

  public static onIncomingSecond(
    context: P2pConnectionContext,
    tx: ITransaction,
    hash: IHash,
    prehash: IHash,
    keptByBlock: boolean
  ): boolean {
    // if (!check_tx_syntax(tx)) {
    //   logger(INFO) << "WRONG TRANSACTION BLOB, Failed to check tx " << txHash << " syntax, rejected";
    //   tvc.m_verifivation_failed = true;
    //   return false;
    // }

    if (!TransactionValidator.checkSematic(tx)) {
      logger.info(
        'WRONG TRANSACTION BLOB, Failed to check tx ' +
          hash +
          ' semantic, rejected'
      );
      return false;
    }
    return this.addNewTx(context, tx, hash, prehash, keptByBlock);
  }

  public static addNewTx(
    context: P2pConnectionContext,
    tx: ITransaction,
    hash: IHash,
    prehash: IHash,
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
    return context.mempool.addTx(context, tx, hash, prehash, keptByBlock);
  }
}
