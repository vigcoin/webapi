import { IHash } from '@vigcoin/crypto';
import { ITransactionPrefix } from '../types';
export const CN_COMMANDS_POOL_BASE = 2000;

export interface IBlockCompletEntry {
  block: Buffer;
  txs?: Buffer[];
}

export interface IBlockFullInfo {
  block: Buffer;
  txs: Buffer[];
  hash: IHash;
}

export interface ITransactionPrefixInfo {
  txHash: IHash;
  txPrefix: ITransactionPrefix;
}

export interface IBlockShortInfo {
  hash: IHash;
  block: Buffer;
  txPrefixes: ITransactionPrefixInfo[];
}
