import { getFastHash } from '@vigcoin/neon';
import assert = require('assert');
import { Hash, Signature } from '../../crypto/types';
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import { TransactionPrefix } from '../transaction/prefix';
import { ITransaction, ITransactionInput, ITransactionPrefix } from '../types';

// tslint:disable-next-line: max-classes-per-file
export class Transaction {
  public static readSubSignature(reader: BufferStreamReader): Signature {
    return reader.read(64);
  }

  public static writeSubSignature(
    writer: BufferStreamWriter,
    signature: Signature
  ) {
    writer.write(signature);
  }
  public static readSignatureCount(input: ITransactionInput) {
    switch (input.tag) {
      case 0xff:
        return 0;
      case 0x02:
        const key: any = input.target;
        return key.outputIndexes.length;
      case 0x03:
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

      const subSig: Signature[] = [];
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

  public static write(writer: BufferStreamWriter, transaction: ITransaction) {
    TransactionPrefix.write(writer, transaction.prefix);
    assert(transaction.signatures.length === transaction.prefix.inputs.length);
    this.writeSignatures(writer, transaction.prefix, transaction.signatures);
  }

  public static hash(transaction: ITransaction): Hash {
    const writer = new BufferStreamWriter(new Buffer(0));
    Transaction.write(writer, transaction);
    const buffer = writer.getBuffer();
    const hash = Buffer.from(getFastHash(buffer), 'hex');
    return hash;
  }
}
