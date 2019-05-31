import { Hash, KeyImage, PublicKey, Signature } from '../crypto/types';

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

export type ITransactionInputTarget = IInputBase | IInputKey | IInputSignature;
export type ITransactionOutputTarget = IOutputKey | IOutputSignature;

export interface ITransactionOutput {
  tag: number;
  amount: number;
  target: ITransactionOutputTarget;
}

export interface ITransactionInput {
  tag: number;
  target: ITransactionInputTarget;
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
  preHash: Hash;
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
  transactions: ITransactionEntry[];
}

// Verification

// tslint:disable-next-line: no-namespace
export namespace VerificationContext {
  export interface IVCTx {
    shouldBeRelayed: boolean;
    verifivationFailed: boolean;
    verifivationImpossible: boolean;
    addedToPool: boolean;
    txFeeTooSmall: boolean;
  }

  export interface IVCBlock {
    addedToMainChain: boolean;
    verificationFailed: boolean;
    markedAsOrphaned: boolean;
    alreadyExists: boolean;
    switchedToAltChain: boolean;
  }
}

// Serialization/Unserialization

export interface ISerializer<T> {
  serialize(data: T): boolean;
  unserialize(data: T): boolean;
}
