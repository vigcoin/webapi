import {
  ETransactionIOType,
  IInputKey,
  IInputSignature,
  ITransaction,
  ITransactionInput,
  uint64,
} from '@vigcoin/types';
import { parameters } from '../../config';
import { logger } from '../../logger';
import { decompose } from './util';

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
    return 0;
  }

  public static getOutput(transaction: ITransaction) {
    let amount = 0;
    for (const output of transaction.prefix.outputs) {
      amount += output.amount;
    }
    return amount;
  }

  public static check(transaction: ITransaction): boolean {
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

  public static getFee(transaction: ITransaction) {
    const inputAmount = TransactionAmount.getInput(transaction);
    const outputAmount = TransactionAmount.getOutput(transaction);
    return inputAmount - outputAmount;
  }

  public static getInputList(transaction: ITransaction) {
    const amounts = [];
    for (const input of transaction.prefix.inputs) {
      const amount = this.getInputSingle(input);
      if (amount) {
        amounts.push(amount);
      }
    }
    return amounts;
  }

  public static getOutputList(transaction: ITransaction) {
    const amounts = [];
    for (const output of transaction.prefix.outputs) {
      amounts.push(output.amount);
    }
    return amounts;
  }

  public static isFusion(transaction: ITransaction): boolean {
    const inputs = TransactionAmount.getInputList(transaction);
    if (inputs.length < parameters.FUSION_TX_MIN_INPUT_COUNT) {
      return false;
    }
    const outputs = TransactionAmount.getOutputList(transaction);
    if (
      inputs.length <
      outputs.length * parameters.FUSION_TX_MIN_IN_OUT_COUNT_RATIO
    ) {
      return false;
    }

    let totalAmount = 0;
    for (const amount of inputs) {
      if (amount < parameters.DEFAULT_DUST_THRESHOLD) {
        return false;
      }
      totalAmount += amount;
    }

    const decomposed = Buffer.from(
      decompose(totalAmount, parameters.DEFAULT_DUST_THRESHOLD)
    );
    const outputsBuffer = Buffer.from(outputs);
    return decomposed.equals(outputsBuffer);
  }

  public static format(amount: uint64) {
    if (amount > Number.MAX_SAFE_INTEGER) {
      logger.error('Danger amount');
      return;
    }
    let str = String(amount);
    const diff = str.length - parameters.CRYPTONOTE_DISPLAY_DECIMAL_POINT;
    if (diff < 0) {
      for (let i = 0; i <= Math.abs(diff); i++) {
        str = '0' + str;
      }
    }
    str =
      str.substring(
        0,
        str.length - parameters.CRYPTONOTE_DISPLAY_DECIMAL_POINT
      ) +
      '.' +
      str.substring(str.length - parameters.CRYPTONOTE_DISPLAY_DECIMAL_POINT);
    return str;
  }
}
