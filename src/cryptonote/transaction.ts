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
import { BufferStreamWriter } from './serialize/writer';

export class TransactionPrefix {
  public static readInput(reader: BufferStreamReader): ITransactionInput {
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
          const keyImage: Buffer = reader.readHash();

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

  public static writeInput(writer: BufferStreamWriter, input: ITransactionInput) {
    writer.writeUInt8(input.tag);
    let target: ITransactionInputTarget;
    switch (input.tag) {
      // IInputBase
      case 0xff:
        target = input.target as IInputBase;
        writer.writeVarint(target.blockIndex);

        break;
      // IInputKey
      case 0x02:
        target = input.target as IInputKey;

        writer.writeUInt64(target.amount);
        writer.writeVarint(target.outputIndexes.length);
        const size = target.outputIndexes.length;
        for (let i = 0; i < size; i++) {
          writer.writeUInt32(target.outputIndexes[i]);
        }
        writer.writeHash(target.keyImage);
        break;
      // IInputSignature
      case 0x03:
        target = input.target as IInputSignature;

        writer.writeVarint(target.amount);
        writer.writeVarint(target.count);
        writer.writeVarint(target.outputIndex);
        break;
      default:
        throw new Error('Unknown output variant tag');
    }
  }

  public static readOutput(reader: BufferStreamReader) {
    let output: ITransactionOutput;
    const amount = reader.readVarint();
    const tag = reader.readUInt8();

    switch (tag) {
      // IOutputKey
      case 0x02:
        output = {
          amount,
          tag,
          target: {
            key: new BaseBuffer(reader.readHash()),
          },
        };
        break;
      // IOutputSignature
      case 0x03:
      // output = {
      //   amount,
      //   tag,
      //   target: {


      //   }
      // };
      default:
        throw new Error('Unknown output variant tag');
    }
    return output;
  }

  public static writeOutput(writer: BufferStreamWriter, output: ITransactionOutput) {
    writer.writeVarint(output.amount);
    writer.writeUInt8(output.tag);
    switch (output.tag) {
      // IOutputKey
      case 0x02:
        const target = output.target as IOutputKey;
        writer.writeHash(target.key);
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
  }

  public static readExtra(reader: BufferStreamReader) {
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

  public static writeExtra(writer: BufferStreamWriter, extra: Buffer) {
    writer.writeVarint(extra.length);
    for (let i = 0; i < extra.length / 2; i++) {
      const temp = extra[i];
      extra[i] = extra[extra.length - 1 - i];
      extra[extra.length - 1 - i] = temp;
    }
    writer.write(extra);
  }

  public static read(reader: BufferStreamReader): ITransactionPrefix {
    const version = reader.readVarint();
    const unlockTime = reader.readVarint();
    const sizeInput = reader.readVarint();
    const inputs = [];
    for (let i = 0; i < sizeInput; i++) {
      inputs.push(TransactionPrefix.readInput(reader));
    }
    const sizeOutput = reader.readVarint();
    const outputs = [];
    for (let i = 0; i < sizeOutput; i++) {
      outputs[i] = outputs.push(TransactionPrefix.readOutput(reader));
    }

    const extra = TransactionPrefix.readExtra(reader);
    return {
      version,
      unlockTime,
      inputs,
      outputs,
      extra,
    };
  }

  public static write(writer: BufferStreamWriter, prefix: ITransactionPrefix) {
    writer.writeVarint(prefix.version);
    writer.writeVarint(prefix.unlockTime);
    writer.writeVarint(prefix.inputs.length);
    const sizeInput = prefix.inputs.length;
    for (let i = 0; i < sizeInput; i++) {
      TransactionPrefix.writeInput(writer, prefix.inputs[i]);
    }
    writer.writeVarint(prefix.outputs.length);
    const sizeOutput = prefix.outputs.length;
    for (let i = 0; i < sizeOutput; i++) {
      TransactionPrefix.writeOutput(writer, prefix.outputs[i]);
    }
    TransactionPrefix.writeExtra(writer, prefix.extra);
  }
}

// tslint:disable-next-line: max-classes-per-file
export class Transaction {
  public static getSubSignature(reader: BufferStreamReader): Signature {
    return new BaseBuffer(reader.read(64));
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

  public static writeSignatureCount(writer: BufferStreamWriter, input: ITransactionInput) {
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
        subSig.push(Transaction.getSubSignature(reader));
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
    // const signatures = [];
    for (let i = 0; i < size; i++) {
      Transaction.writeSignatureCount(writer, signatures);

      const subSig: Signature[] = [];
      for (let j = 0; j < count; j++) {
        subSig.push(Transaction.getSubSignature(reader));
      }
      signatures[i] = subSig;
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
    this.writeSignatures(writer, transaction.signatures);
  }
}
