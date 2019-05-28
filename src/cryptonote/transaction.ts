import { BaseBuffer, KeyImage } from '../crypto/types';
import { BufferStreamReader } from './serialize/reader';
import {
  IInputBase,
  ITransaction,
  ITransactionInput,
  ITransactionOutput,
  ITransactionPrefix,
} from './types';

export class TransactionPrefix {
  public static parseInput(reader: BufferStreamReader): ITransactionInput {
    let inputs: ITransactionInput;
    const tag = reader.readUInt8();
    switch (tag) {
      // IInputBase
      case 0xff:
        inputs = {
          blockIndex: reader.readUInt32(),
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

          inputs = {
            amount,
            keyImage,
            outputIndexes: outputs,
          };
        }
        break;
      // IInputSignature
      case 0x03:
        {
          const amount = reader.readUInt64();
          const count = reader.readUInt8();
          const outputIndex = reader.readUInt32();
          inputs = {
            amount,
            count,
            outputIndex,
          };
        }
        break;
    }
    return inputs;
  }
  public static parseOutput(reader: BufferStreamReader) {
    return {};
  }

  public static parse(reader: BufferStreamReader) {
    const version = reader.readUInt8();
    const unlockTime = reader.readUInt64();
    const inputs = TransactionPrefix.parseInput(reader);
    const outputs = TransactionPrefix.parseOutput(reader);
  }
}

export class Transaction {
  public static parse(reader: BufferStreamReader) {
    // const input: ITransactionInput =
    // reader.read
    // const transaction: ITransaction = {
    // };
  }

  public transaction: ITransaction;
}
