import * as assert from 'assert';
import * as crypto from 'crypto';
import { parameters } from '../../config';
import {
  CryptoSignature,
  IHash,
  ISignature,
  IsPublicKey,
} from '../../crypto/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import {
  ETransactionIOType,
  IInputKey,
  IInputSignature,
  IOutputKey,
  IOutputSignature,
  ITransaction,
  ITransactionOutput,
  ITransactionPrefix,
  usize,
} from '../types';
import { TransactionAmount } from './amount';
import { Transaction } from './index';
import { TransactionInput } from './input';
import { TransactionOutput } from './output';

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

  public static checkSignatureInput(
    context: P2pConnectionContext,
    input: IInputSignature,
    hash: IHash,
    preHash: IHash,
    signatures: ISignature[][]
  ): boolean {
    assert(input.count === signatures.length);
    if (!context.blockchain.hasSignature(input.amount)) {
      logger.info(
        'transaction :  ' +
          hash +
          ' contains multisignature input with invalid amount.'
      );
      return false;
    }
    const outputs = context.blockchain.getSignature(input.amount);
    if (input.outputIndex >= outputs.length) {
      logger.info(
        'transaction : ' +
          hash +
          ' contains multisignature input with invalid outputIndex.'
      );
      return false;
    }
    const outputIndex = outputs[input.outputIndex];

    if (outputIndex.isUsed) {
      logger.info(
        ' tx ：' + hash + ' contains double spending multisignature input.'
      );
      return false;
    }

    const outTx = context.blockchain.getTransactionEntryByIndex(
      outputIndex.transactionIndex
    );
    if (!context.blockchain.isSpendtimeUnlocked(outTx.tx.prefix.unlockTime)) {
      logger.info(
        'tx : ' +
          hash +
          ' contains multisignature input which points to a locked transaction.'
      );

      return false;
    }

    assert(
      outTx.tx.prefix.outputs[outputIndex.outputIndex].amount === input.amount
    );
    assert(
      outTx.tx.prefix.outputs[outputIndex.outputIndex].tag ===
        ETransactionIOType.SIGNATURE
    );

    const output = outTx.tx.prefix.outputs[outputIndex.outputIndex]
      .target as IOutputSignature;
    if (input.count !== output.count) {
      logger.info(
        'tx << ' +
          hash +
          ' contains multisignature input with invalid signature count.'
      );
      return false;
    }

    let inputSignatureIndex = 0;
    let outputKeyIndex = 0;

    while (inputSignatureIndex < input.count) {
      if (outputKeyIndex === output.keys.length) {
        logger.info(
          'tx : ' +
            hash +
            ' contains multisignature input with invalid signatures.'
        );
        return false;
      }
      if (
        CryptoSignature.check(
          preHash,
          output.keys[outputKeyIndex],
          signatures[inputSignatureIndex]
        )
      ) {
        ++inputSignatureIndex;
      }
      ++outputKeyIndex;
    }
    return true;
  }

  public static checkKeyInput(
    context: P2pConnectionContext,
    input: IInputKey,
    preHash: IHash,
    outKeys: ITransactionOutput[],
    signatures: ISignature[][]
  ): boolean {
    if (!context.blockchain.hasOutput(input.amount)) {
      logger.error('Input amount not found!');
      return false;
    }
    if (!input.outputIndexes.length) {
      logger.error('No output found!');
      return;
    }
    let maxBlockHeight = 0;
    const absoluteOffsets = TransactionOutput.toAbsolute(input.outputIndexes);
    const pair = context.blockchain.getOutput(input.amount);
    let count = 0;
    for (const offset of absoluteOffsets) {
      if (offset >= pair.length) {
        logger.error(
          'Wrong index in transaction inputs:' +
            offset +
            ', expected maximum ' +
            (pair.length - 1)
        );
        return false;
      }
      const txe = context.blockchain.getTransactionEntryByIndex(
        pair[offset].txIdx
      );
      const idx = pair[offset].outputIdx;
      const len = txe.tx.prefix.outputs.length;
      if (idx >= len) {
        logger.error(
          'Wrong index in transaction outputs: ' +
            idx +
            ', expected less then ' +
            len
        );
        return false;
      }
      if (
        TransactionInput.isValidKeyOutput(
          context,
          txe.tx,
          txe.tx.prefix.outputs[idx]
        )
      ) {
        logger.info(
          'Failed to handle_output for output no = ' +
            count +
            ', with absolute offset ' +
            offset
        );
        return false;
      }
      if (input.outputIndexes.length !== outKeys.length) {
        logger.info(
          'Output keys for tx with amount = ' +
            input.amount +
            ' and count indexes ' +
            input.outputIndexes.length +
            ' returned wrong keys count ' +
            outKeys.length
        );
        return false;
      }
      if (signatures.length !== outKeys.length) {
        logger.error(
          'internal error: tx signatures count=' +
            signatures.length +
            ' mismatch with outputs keys count for inputs=' +
            outKeys.length
        );
        return false;
      }
      outKeys.push(txe.tx.prefix.outputs[idx]);
      count++;
      if (count === absoluteOffsets.length) {
        if (maxBlockHeight < pair[offset].txIdx.block) {
          maxBlockHeight = pair[offset].txIdx.block;
        }
      }
    }
    let sigBuffer = Buffer.alloc(0);
    for (const signature of signatures) {
      for (const buffer of signature) {
        sigBuffer = Buffer.concat([sigBuffer, buffer]);
      }
    }
    return CryptoSignature.checkRing(
      preHash,
      input.keyImage,
      outKeys,
      outKeys.length,
      sigBuffer
    );
  }

  public static checkInputs(
    context: P2pConnectionContext,
    tx: ITransaction,
    hash: IHash,
    preHash: IHash,
    keptByBlock: boolean
  ): boolean {
    let inputIndex = 0;
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
            if (context.blockchain.hasKeyImageAsSpend(key.keyImage)) {
              logger.info(
                'Key image already spent in blockchain: ' +
                  key.keyImage.toString('hex')
              );
              return false;
            }
            const outputKeys = [];
            if (
              !TransactionValidator.checkKeyInput(
                context,
                key,
                preHash,
                outputKeys,
                tx.signatures
              )
            ) {
              logger.info('Failed to check ring signature for tx ' + hash);
              return false;
            }
            inputIndex++;
          }
          break;
        case ETransactionIOType.SIGNATURE:
          {
            const key = input.target as IInputSignature;
            if (
              !TransactionValidator.checkSignatureInput(
                context,
                key,
                hash,
                preHash,
                tx.signatures
              )
            ) {
              return false;
            }
            inputIndex++;
          }
          break;
        default: {
          logger.info('tx : ' + hash + ' contains input of unsupported type.');
          return false;
        }
      }
    }
    return true;
  }

  public static checkSize(context: P2pConnectionContext, size: usize): boolean {
    const maxSize =
      context.blockchain.getCurrentCumulativeBlockSizeLimit() -
      parameters.CRYPTONOTE_COINBASE_BLOB_RESERVED_SIZE;
    if (size > maxSize) {
      logger.info(
        'transaction is too big : ' +
          size +
          ', maximun allowed size is ' +
          maxSize
      );
      return false;
    }
    return true;
  }
}
