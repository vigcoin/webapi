import * as crypto from 'crypto';
import { parameters } from '../../config';
import { IHash, ISignature, IsPublicKey } from '../../crypto/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import {
  ETransactionIOType,
  IInputKey,
  IInputSignature,
  IOutputKey,
  IOutputSignature,
  ITransaction,
  ITransactionPrefix,
  uint32,
} from '../types';
import { TransactionAmount } from './amount';
import { Transaction } from './index';

export class TransactionValidator {
  // Check Transaction Overflow

  public static checkMoneyOverflowInputs(prefix: ITransactionPrefix): boolean {
    let money = 0;
    for (const input of prefix.inputs) {
      let amount = 0;
      switch (input.tag) {
        case ETransactionIOType.KEY:
          const key = input.target as IInputKey;
          amount = key.amount;
        case ETransactionIOType.SIGNATURE:
          const signature = input.target as IInputSignature;
          amount = signature.amount;
          break;
      }
      if (money > amount + money) {
        return false;
      }

      money += amount;
      if (money > Number.MAX_SAFE_INTEGER) {
        return false;
      }
    }
    return true;
  }

  public static checkMoneyOverflowOutputs(prefix: ITransactionPrefix): boolean {
    let money = 0;
    for (const output of prefix.outputs) {
      if (money > output.amount + money) {
        return false;
      }
      money += output.amount;
      if (money > Number.MAX_SAFE_INTEGER) {
        return false;
      }
    }
    return true;
  }

  public static checkMoneyOverflow(prefix: ITransactionPrefix): boolean {
    return (
      TransactionValidator.checkMoneyOverflowInputs(prefix) &&
      TransactionValidator.checkMoneyOverflowOutputs(prefix)
    );
  }

  // Check Transaction validity
  public static checkOutputs(prefix: ITransactionPrefix): boolean | string {
    for (const output of prefix.outputs) {
      switch (output.tag) {
        case ETransactionIOType.KEY:
          if (output.amount === 0) {
            return 'Zero amount ouput!';
          }
          const outKey = output.target as IOutputKey;
          if (!IsPublicKey(outKey.key)) {
            return 'Output with invalid key';
          }
          break;
        case ETransactionIOType.SIGNATURE:
          const signature = output.target as IOutputSignature;
          if (signature.count > signature.keys.length) {
            return 'Multisignature output with invalid required signature count';
          }
          for (const key in signature.keys) {
            if (!IsPublicKey(key)) {
              return 'Multisignature output with invalid public key';
            }
          }
          break;
        default:
          return 'Output with invalid type';
      }
    }
    return true;
  }

  public static checkInputsTypes(prefix: ITransactionPrefix): boolean {
    for (const input of prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
        case ETransactionIOType.SIGNATURE:
          break;
        default:
          return false;
      }
    }
    return true;
  }

  public static checkKeyImageDuplication(tx: ITransaction) {
    const images = {};
    for (const input of tx.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          const image = input.target as IInputKey;
          const hash = image.keyImage.toString('hex');
          if (images[hash]) {
            return false;
          }
          images[hash] = true;
          break;
      }
    }
    return true;
  }

  public static checkMulitSignatureDuplication(prefix: ITransactionPrefix) {
    const images = {};
    for (const input of prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.SIGNATURE:
          const signature = input.target as IInputSignature;
          const str = signature.amount + '@' + signature.outputIndex;
          const secret = 'vig';
          const hash = crypto
            .createHmac('sha256', secret)
            .update(str)
            .digest('hex');
          if (images[hash]) {
            return false;
          }
          images[hash] = true;
          break;
      }
    }
    return true;
  }

  public static checkSematic(transaction: ITransaction) {
    if (!transaction.prefix.inputs.length) {
      logger.error(
        'Empty inputs, rejected for transaction : ' +
          Transaction.hash(transaction)
      );
      return false;
    }
    if (!TransactionValidator.checkInputsTypes(transaction.prefix)) {
      logger.info(
        'unsupported input types for tx id= ' + Transaction.hash(transaction)
      );
      return false;
    }
    const message = TransactionValidator.checkOutputs(transaction.prefix);
    if (message !== true) {
      logger.error('Transaction(tx) with invalid outputs!');
      logger.error('Rejected for tx id= ' + Transaction.hash(transaction));
      logger.error('Reason : ' + message);
      return false;
    }

    if (!TransactionValidator.checkMoneyOverflow(transaction.prefix)) {
      logger.error('Transaction(tx) have money overflow!');
      logger.error('Rejected for tx id= ' + Transaction.hash(transaction));
      return false;
    }

    if (!TransactionAmount.check(transaction)) {
      return false;
    }

    if (!TransactionValidator.checkKeyImageDuplication(transaction)) {
      logger.error('Transaction(tx) has a few inputs with identical keyimages');
      return false;
    }

    if (
      !TransactionValidator.checkMulitSignatureDuplication(transaction.prefix)
    ) {
      logger.error(
        'Transaction(tx) has a few multisignature inputs with identical output indexes'
      );
      return false;
    }
    return true;
  }

  public static isFusion(transaction: ITransaction, txBuffer: Buffer) {
    if (txBuffer.length > parameters.FUSION_TX_MAX_SIZE) {
      return false;
    }
    return TransactionAmount.isFusion(transaction);
  }

  public static checkKeyInput(
    context: P2pConnectionContext,
    input: IInputKey,
    prefix: IHash,
    signatures: ISignature[]
    // maxBlockheight: uint32
  ): boolean {
    if (!context.blockchain.hasOutput(input.amount)) {
      logger.info('Input amount not found!');
      return false;
    }
    if (!input.outputIndexes.length) {
      logger.info('No output found!');
      return;
    }
    return true;
  }

  public static checkInputs(
    context: P2pConnectionContext,
    tx: ITransaction,
    hash: IHash,
    prehash: IHash,
    keptByBlock: boolean
  ): boolean {
    const inputIndex = 0;
    for (const input of tx.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          {
            const key = input.target as IInputKey;
            if (!key.outputIndexes.length) {
              logger.info(
                'empty in_to_key.outputIndexes in transaction with id ' + hash
              );
              return false;
            }
            if (context.blockchain.hasKeyImage(key.keyImage)) {
              logger.info(
                'Key image already spent in blockchain: ' +
                  key.keyImage.toString('hex')
              );
              return false;
            }
            if (
              !TransactionValidator.checkKeyInput(
                context,
                key,
                prehash,
                tx.signatures[inputIndex]
              )
            ) {
              logger.info('Failed to check ring signature for tx ' + hash);
              return false;
            }
          }
          break;
        case ETransactionIOType.SIGNATURE: {
        }
      }
    }
    return true;
  }
}
