import { Hash } from '../../crypto/types';
import { ITransactionPrefix } from '../types';
export const CN_COMMANDS_POOL_BASE = 2000;

export interface IBlockCompletEntry {
  block: Buffer;
  txs?: Buffer[];
}

export interface IBlockFullInfo {
  block: Buffer;
  txs: Buffer[];
  hash: Hash;
}

export interface ITransactionPrefixInfo {
  txHash: Hash;
  txPrefix: ITransactionPrefix;
}

export interface IBlockShortInfo {
  hash: Hash;
  block: Buffer;
  txPrefixes: ITransactionPrefixInfo[];
}
