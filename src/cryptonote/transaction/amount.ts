import { logger } from '../../logger';
import {
  ETransactionIOType,
  IInputKey,
  IInputSignature,
  ITransaction,
  ITransactionInput,
} from '../types';

export class TransactionAmount {
  public static getInput(transaction: ITransaction) {
    let amount = 0;
    for (const input of transaction.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          const key = input.target as IInputKey;
          amount += key.amount;
          break;
        case ETransactionIOType.SIGNATURE:
          const signature = input.target as IInputSignature;
          amount += signature.amount;
          break;
      }
    }
    return amount;
  }

  public static getInputSingle(input: ITransactionInput) {
    switch (input.tag) {
      case ETransactionIOType.KEY:
        const key = input.target as IInputKey;
        return key.amount;
      case ETransactionIOType.SIGNATURE:
        const signature = input.target as IInputSignature;
        return signature.amount;
    }
  }

  public static getOutput(transaction: ITransaction) {
    let amount = 0;
    for (const output of transaction.prefix.outputs) {
      amount += output.amount;
    }
    return amount;
  }

  public static check(transaction: ITransaction) {
    const inputAmount = TransactionAmount.getInput(transaction);
    const outputAmount = TransactionAmount.getOutput(transaction);
    if (outputAmount > inputAmount) {
      logger.info(
        'transaction use more money then it has: use ' +
          outputAmount +
          ', have ' +
          inputAmount
      );
      return false;
    }
    return true;
  }
}
