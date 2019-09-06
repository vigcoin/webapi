import assert = require('assert');
import { parameters } from '../../config';
import { CNFashHash, IHash, ISignature } from '../../crypto/types';
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import { TransactionPrefix } from '../transaction/prefix';
import {
  ETransactionIOType,
  ITransaction,
  ITransactionEntry,
  ITransactionInput,
  ITransactionPrefix,
  usize,
} from '../types';
import { TransactionAmount } from './amount';
import { decompose } from './util';

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

  public static toBuffer(transaction: ITransaction): Buffer {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    return writer.getBuffer();
  }

  public static hash(transaction: ITransaction): IHash {
    const hashStr = CNFashHash(Transaction.toBuffer(transaction));
    const hash = Buffer.from(hashStr, 'hex');
    return hash;
  }
}
