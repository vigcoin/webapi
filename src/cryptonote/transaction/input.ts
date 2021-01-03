import {
  ETransactionIOType,
  ITransaction,
  ITransactionOutput,
} from '@vigcoin/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';

export class TransactionInput {
  public static isValidKeyOutput(
    context: P2pConnectionContext,
    tx: ITransaction,
    output: ITransactionOutput
  ) {
    if (!context.blockchain.isSpendtimeUnlocked(tx.prefix.unlockTime)) {
      logger.info(
        'One of outputs for one of inputs have wrong tx.unlockTime = ' +
          tx.prefix.unlockTime
      );
      return false;
    }
    if (output.tag !== ETransactionIOType.KEY) {
      logger.info('Output have wrong type id, which=' + output.tag);
      return false;
    }
    return true;
  }
}
