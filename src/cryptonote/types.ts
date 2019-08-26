import {
  IHash,
  IKeyImage,
  IPublicKey,
  ISignature,
  SIGNATURE_LENGTH,
} from '../crypto/types';

export type uint64 = number;
export type uint32 = number;
export type uint16 = number;
export type uint8 = number;

export type int64 = number;
export type int32 = number;
export type int16 = number;
export type int8 = number;
export type usize = number;

export type UINT64 = Buffer;
export type INT64 = Buffer;

// Input Transactions
export interface IInputBase {
  blockIndex: uint32;
}

export interface IInputKey {
  amount: uint64;
  outputIndexes: uint32[];
  keyImage: IKeyImage;
}

export interface IInputSignature {
  amount: uint64;
  count: uint8;
  outputIndex: uint32;
}

// Output Transactions

export interface IOutputKey {
  key: IPublicKey;
}

export interface IOutputSignature {
  keys: IPublicKey[];
  count: uint8;
}

export type ITransactionInputTarget = IInputBase | IInputKey | IInputSignature;
export type ITransactionOutputTarget = IOutputKey | IOutputSignature;

export interface ITransactionOutput {
  tag: uint8;
  amount: uint64;
  target: ITransactionOutputTarget;
}

export enum ETransactionIOType {
  BASE = 0xff,
  KEY = 0x02,
  SIGNATURE = 0x03,
}

export interface ITransactionInput {
  tag: uint8;
  target: ITransactionInputTarget;
}

export interface ITransactionPrefix {
  version: uint8;
  unlockTime: uint64;
  inputs: ITransactionInput[];
  outputs: ITransactionOutput[];
  extra: Buffer; // uint8[];
}

export interface ITransaction {
  prefix: ITransactionPrefix;
  signatures: ISignature[][];
}

// Block / Blockchain

export interface IVersion {
  major: uint8;
  minor: uint8;
  patch: uint8;
}

export interface IBlockHeader {
  version: IVersion;
  nonce: number;
  timestamp: number;
  preHash: IHash;
}

export interface IBlock {
  header: IBlockHeader;
  transaction: ITransaction;
  transactionHashes: IHash[];
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

// Verification Context

// tslint:disable-next-line: no-namespace
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

// Memory Pool
export interface IBlockInfo {
  height: uint32;
  id: IHash;
}

export interface ITransactionCheckInfo {
  maxUsedBlock: IBlockInfo;
  lastFailedBlock: IBlockInfo;
}

export interface ITransactionDetails {
  checkInfo: ITransactionCheckInfo;
  id: IHash;
  tx: ITransaction;
  blobSize: usize;
  fee: uint64;
  keptByBlock: boolean;
  receiveTime: Date;
}

export type IGlobalOut = Map<uint64, uint64>;

export interface ITransactionIndex {
  block: uint32;
  transaction: uint16;
}

export interface ITransactionMultisignatureOutputUsage {
  transactionIndex: ITransactionIndex;
  outputIndex: uint16;
  isUsed: boolean;
}
