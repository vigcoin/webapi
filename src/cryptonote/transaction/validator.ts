import { logger } from '../../logger';
import { ETransactionIOType, ITransaction, ITransactionPrefix } from '../types';
import { Transaction } from './index';

export class TransactionValidator {
  public static checkOutputs(prefix: ITransactionPrefix): boolean | string {
    for (const output of prefix.outputs) {
      switch (output.tag) {
        case ETransactionIOType.BASE:
        case ETransactionIOType.KEY:
          if (output.amount === 0) {
            return 'Zero amount ouput!';
          }
          break;

        case ETransactionIOType.SIGNATURE:
          break;
        default:
          return false;
      }
    }
  }

  public static checkInputs(prefix: ITransactionPrefix): boolean {
    for (const input of prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.BASE:
        case ETransactionIOType.KEY:
        case ETransactionIOType.SIGNATURE:
          break;
        default:
          return false;
      }
    }
    return true;
  }

  public static checkSematic(transaction: ITransaction, keptByBlock: boolean) {
    if (!transaction.prefix.inputs.length) {
      logger.error(
        'Empty inputs, rejected for transaction : ' +
          Transaction.hash(transaction)
      );
      return false;
    }
    if (!TransactionValidator.checkInputs(transaction.prefix)) {
      logger.info(
        'unsupported input types for tx id= ' + Transaction.hash(transaction)
      );
      return false;
    }
  }
}
