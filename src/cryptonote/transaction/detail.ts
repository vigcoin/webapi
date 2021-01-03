import { IBlockInfo, ITransactionDetails } from '@vigcoin/types';
import { readBufferDate } from '../../util/time';
import { BufferStreamReader } from '../serialize/reader';
import { Transaction } from './index';

export class TransactionDetails {
  public static read(reader: BufferStreamReader): ITransactionDetails {
    const id = reader.readHash();
    const blobSize = reader.readVarint();
    const fee = reader.readVarint();

    const tx = Transaction.read(reader);
    const maxUsedBlock = TransactionDetails.readBlockInfo(reader);
    const lastFailedBlock = TransactionDetails.readBlockInfo(reader);
    const keptByBlock = reader.readBoolean();
    const timeBuffer = reader.readVarintUInt64();
    const receiveTime = readBufferDate(timeBuffer);
    return {
      blobSize,
      checkInfo: {
        lastFailedBlock,
        maxUsedBlock,
      },
      fee,
      id,
      keptByBlock,
      receiveTime,
      tx,
    };
  }

  public static readBlockInfo(reader: BufferStreamReader): IBlockInfo {
    const height = reader.readVarint();
    const id = reader.readHash();
    return {
      height,
      id,
    };
  }
}
