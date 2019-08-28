import assert = require('assert');
import { parameters } from '../../config';
import { CNFashHash, IHash, ISignature } from '../../crypto/types';
import { logger } from '../../logger';
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import { TransactionPrefix } from '../transaction/prefix';
import { ETransactionIOType, IInputKey, IInputSignature ,
  ITransaction,
  ITransactionEntry,
  ITransactionInput,
  ITransactionPrefix,
  usize,
} from '../types';

// tslint:disable-next-line: max-classes-per-file
export class Transaction {
  public static readSubSignature(reader: BufferStreamReader): ISignature {
    return reader.read(64);
  }

  public static writeSubSignature(
    writer: BufferStreamWriter,
    signature: ISignature
  ) {
    writer.write(signature);
  }
  public static readSignatureCount(input: ITransactionInput) {
    switch (input.tag) {
      case ETransactionIOType.BASE:
        return 0;
      case ETransactionIOType.KEY:
        const key: any = input.target;
        return key.outputIndexes.length;
      case ETransactionIOType.SIGNATURE:
        const signature: any = input.target;
        return signature.count;
    }
  }

  public static readSignatures(
    reader: BufferStreamReader,
    prefix: ITransactionPrefix
  ) {
    const size = prefix.inputs.length;
    const signatures = [];
    for (let i = 0; i < size; i++) {
      const count = Transaction.readSignatureCount(prefix.inputs[i]);

      const subSig: ISignature[] = [];
      for (let j = 0; j < count; j++) {
        subSig.push(Transaction.readSubSignature(reader));
      }
      signatures[i] = subSig;
    }
    return signatures;
  }

  public static writeSignatures(
    writer: BufferStreamWriter,
    prefix: ITransactionPrefix,
    signatures: any[][]
  ) {
    const size = signatures.length;
    for (let i = 0; i < size; i++) {
      for (const signature of signatures[i]) {
        Transaction.writeSubSignature(writer, signature);
      }
    }
    return signatures;
  }

  public static read(reader: BufferStreamReader): ITransaction {
    const prefix = TransactionPrefix.read(reader);
    return {
      prefix,
      signatures: Transaction.readSignatures(reader, prefix),
    };
  }

  public static readEntry(reader: BufferStreamReader): ITransactionEntry {
    const tx = Transaction.read(reader);
    const size = reader.readVarint();

    const globalOutputIndexes = [];

    for (let i = 0; i < size; i++) {
      const index = reader.readVarint();
      globalOutputIndexes.push(index);
    }

    return {
      tx,
      // tslint:disable-next-line:object-literal-sort-keys
      globalOutputIndexes,
    };
  }

  public static writeEntry(
    writer: BufferStreamWriter,
    entry: ITransactionEntry
  ) {
    Transaction.write(writer, entry.tx);
    writer.writeVarint(entry.globalOutputIndexes.length);
    for (const index of entry.globalOutputIndexes) {
      writer.writeVarint(index);
    }
  }

  public static write(writer: BufferStreamWriter, transaction: ITransaction) {
    TransactionPrefix.write(writer, transaction.prefix);
    assert(transaction.signatures.length === transaction.prefix.inputs.length);
    this.writeSignatures(writer, transaction.prefix, transaction.signatures);
  }

  public static hash(transaction: ITransaction): IHash {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    const buffer = writer.getBuffer();
    const hashStr = CNFashHash(buffer);
    const hash = Buffer.from(hashStr, 'hex');
    return hash;
  }

  public static getAmountInput(transaction: ITransaction) {
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

  public static getAmountInputSingle(input: ITransactionInput) {
    switch (input.tag) {
      case ETransactionIOType.KEY:
        const key = input.target as IInputKey;
        return key.amount;
      case ETransactionIOType.SIGNATURE:
        const signature = input.target as IInputSignature;
        return signature.amount;
    }
  }

  public static getAmountOutput(transaction: ITransaction) {
    let amount = 0;
    for (const output of transaction.prefix.outputs) {
      amount += output.amount;
    }
    return amount;
  }

  public static checkAmount(transaction: ITransaction) {
    const inputAmount = Transaction.getAmountInput(transaction);
    const outputAmount = Transaction.getAmountOutput(transaction);
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

  public static isFusion(transaction: ITransaction, size: usize) {
    if (size > parameters.FUSION_TX_MAX_SIZE) {
      return false;
    }
    if (
      transaction.prefix.inputs.length < parameters.FUSION_TX_MIN_INPUT_COUNT
    ) {
      return false;
    }

    if (
      transaction.prefix.inputs.length <
      transaction.prefix.outputs.length *
        parameters.FUSION_TX_MIN_IN_OUT_COUNT_RATIO
    ) {
      return false;
    }

    let totalAmount = 0;

    for (const input of transaction.prefix.inputs) {
      const amount = Transaction.getAmountInputSingle(input);
      if (amount < parameters.DEFAULT_DUST_THRESHOLD) {
        return false;
      }
      totalAmount += amount;
    }
  }
}
