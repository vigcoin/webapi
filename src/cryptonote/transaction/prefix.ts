import assert = require('assert');
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import {
  IInputBase,
  IInputKey,
  IInputSignature,
  IOutputKey,
  ITransactionInput,
  ITransactionInputTarget,
  ITransactionOutput,
  ITransactionPrefix,
} from '../types';

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

  public static writeInput(
    writer: BufferStreamWriter,
    input: ITransactionInput
  ) {
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
            key: reader.readHash(),
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
        throw new Error('Reading unknown ouput variant tag');
    }
    return output;
  }

  public static writeOutput(
    writer: BufferStreamWriter,
    output: ITransactionOutput
  ) {
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
        throw new Error('Writing unknown output variant tag');
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
      outputs.push(TransactionPrefix.readOutput(reader));
    }

    const extra = TransactionPrefix.readExtra(reader);
    return {
      version,
      // tslint:disable-next-line:object-literal-sort-keys
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
