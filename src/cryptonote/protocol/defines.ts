import { Hash } from '../../crypto/types';
import { ITransactionPrefix } from '../types';
export const CN_COMMANDS_POOL_BASE = 2000;

export interface IBlockCompletEntry {
  block: string;
  txs: string[];
}

export interface IBlockFullInfo {
  block: string;
  txs: string[];
  hash: Hash;
}

export interface ITransactionPrefixInfo {
  txHash: Hash;
  txPrefix: ITransactionPrefix;
}

export interface IBlockShortInfo {
  hash: Hash;
  block: string;
  txPrefixes: ITransactionPrefixInfo[];
}
