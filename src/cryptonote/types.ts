import { KeyImage, PublicKey, Signature, Hash } from '../crypto/types';

// Input Transactions
export interface IInputBase {
  blockIndex: number;
}

export interface IInputKey {
  amount: number;
  outputIndexes: number[];
  keyImage: KeyImage;
}

export interface IInputSignature {
  amount: number;
  count: number;
  outputIndex: number;
}

// Output Transactions

export interface IOutputKey {
  key: PublicKey;
}

export interface IOutputSignature {
  keys: PublicKey[];
  count: number;
}

export type ITransactionInput = IInputBase | IInputKey | IInputSignature;
export type ITransactionOutputTarget = IOutputKey | IOutputSignature;

export interface ITransactionOutput {
  amount: number;
  target: ITransactionOutputTarget;
}

export interface ITransactionPrefix {
  version: number;
  unlockTime: number;
  inputs: ITransactionInput[];
  outputs: ITransactionOutput[];
  extra: Buffer;
}

export interface ITransaction {
  prefix: ITransactionPrefix;
  signatures: Signature[][];
}

export interface IVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface IBlockHeader {
  version: IVersion;
  nonce: number;
  timestamp: number;
  preHash: Buffer;
}

export interface IBlock {
  header: IBlockHeader;
  transaction: ITransaction;
  transactionHashes: Hash[];
}

export type IDifficulty = number;

export interface ITransactionEntry {
  tx: ITransaction;
  globalOutputIndexes: number[];
}

export interface IBlockEntry {
  block: IBlock;
  height: number;
  size: number;
  difficulty: IDifficulty;
  generatedCoins: number;
  transactions: ITransactionEntry;
}