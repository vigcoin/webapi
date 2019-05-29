import assert = require('assert');
import { BaseBuffer, KeyImage, Signature } from '../crypto/types';
import { BufferStreamReader } from './serialize/reader';
import {
  IInputBase,
  IOutputKey,
  ITransaction,
  ITransactionInput,
  ITransactionOutput,
  ITransactionPrefix,
  IInputKey,
  IInputSignature,
  ITransactionInputTarget,
} from './types';

export class TransactionPrefix {
  public static parseInput(reader: BufferStreamReader): ITransactionInput {
    const tag = reader.readUInt8();
    let target: ITransactionInputTarget;
    switch (tag) {
      // IInputBase
      case 0xff:
        target = {
          blockIndex: reader.readVarint(),
        };
        break;
      // IInputKey
      case 0x02:
        {
          const amount = reader.readUInt64();
          const size = reader.readVarint();
          const outputs: number[] = [];
          for (let i = 0; i < size; i++) {
            outputs.push(reader.readUInt32());
          }
          const keyImage: KeyImage = new BaseBuffer(reader.readHash());

          target = {
            amount,
            keyImage,
            outputIndexes: outputs,
          };
        }
        break;
      // IInputSignature
      case 0x03:
        {
          const amount = reader.readVarint();
          const count = reader.readVarint();
          const outputIndex = reader.readVarint();
          target = {
            amount,
            count,
            outputIndex,
          };
        }
        break;
      default:
        throw new Error('Unknown input variant tag');
    }
    return { tag, target };
  }
  public static parseOutput(reader: BufferStreamReader) {
    let output: ITransactionOutput;
    const amount = reader.readVarint();
    const tag = reader.readUInt8();

    switch (tag) {
      // IOutputKey
      case 0x02:
        output = {
          amount,
          target: {
            key: new BaseBuffer(reader.readHash()),
          },
        };
        break;
      case 0x03:
      // output = {
      //   amount,
      //   target: {

      //   }
      // };
      default:
        throw new Error('Unknown output variant tag');
    }
    return output;
  }

  public static parseExtra(reader: BufferStreamReader) {
    const size = reader.readVarint();
    const buffer = reader.read(size);
    const length = buffer.length;
    for (let i = 0; i < length / 2; i++) {
      const temp = buffer[i];
      buffer[i] = buffer[length - 1 - i];
      buffer[length - 1 - i] = temp;
    }
    return buffer;
  }

  public static parse(reader: BufferStreamReader): ITransactionPrefix {
    const version = reader.readVarint();
    const unlockTime = reader.readVarint();
    const sizeInput = reader.readVarint();
    const inputs = [];
    for (let i = 0; i < sizeInput; i++) {
      inputs.push(TransactionPrefix.parseInput(reader));
    }
    const sizeOutput = reader.readVarint();
    const outputs = [];
    for (let i = 0; i < sizeOutput; i++) {
      outputs[i] = outputs.push(TransactionPrefix.parseOutput(reader));
    }

    const extra = TransactionPrefix.parseExtra(reader);
    return {
      version,
      unlockTime,
      inputs,
      outputs,
      extra,
    };
  }
}

// tslint:disable-next-line: max-classes-per-file
export class Transaction {
  public static getSubSignature(reader: BufferStreamReader): Signature {
    return new BaseBuffer(reader.read(64));
  }
  public static getSignatureCount(input: ITransactionInput) {
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
  public static parseSignatures(
    reader: BufferStreamReader,
    prefix: ITransactionPrefix
  ) {
    const size = prefix.inputs.length;
    const signatures = [];
    for (let i = 0; i < size; i++) {
      const count = Transaction.getSignatureCount(prefix.inputs[i]);

      const subSig: Signature[] = [];
      for (let j = 0; j < count; j++) {
        subSig.push(Transaction.getSubSignature(reader));
      }
      signatures[i] = subSig;
    }
    return signatures;
  }
  public static parse(reader: BufferStreamReader): ITransaction {
    const prefix = TransactionPrefix.parse(reader);
    return {
      prefix,
      signatures: Transaction.parseSignatures(reader, prefix),
    };
  }
}
