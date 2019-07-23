import { Hash } from '../crypto/types';
import {
  IBlock as IBlockTypes,
  uint16,
  uint32,
  uint64,
  uint8,
} from '../cryptonote/types';
import { IPeer } from '../p2p';

// tslint:disable-next-line: no-namespace
export namespace Configuration {
  export interface IVersion {
    major: number;
    minor: number;
    patch: number;
  }

  export interface IBlock {
    genesisCoinbaseTxHex: string;
    version: IVersion;
  }

  export interface ITransaction {
    version: IVersion;
  }

  export interface INet {
    pubKey: string;
    p2pPort: uint16;
    rpcPort: uint16;
    walletPort: uint16;
    version: IVersion;
  }

  export interface ICheckPoint {
    height: uint32;
    blockId: string;
  }

  export interface IBlockFile {
    data: string;
    index: string;
    cache: string;
    chain: string;
  }

  export interface IExtFile {
    pool: string;
    p2p: string;
    miner: string;
  }

  export interface IHardfork {
    version: uint8;
    height: uint64;
    threshold: uint8;
    time: Date;
  }

  export interface IStorageVersion {
    blockCacheArchive: IVersion;
    blockCacheIndicesArchive: IVersion;
  }

  export interface ICurrency {
    block: IBlock;
    blockFiles: IBlockFile;
    hardfork: IHardfork[];
  }

  export interface IGenesis {
    block: IBlockTypes;
    hash: Hash;
  }

  export interface IConfig {
    name: string;
    createTime: Date;
    block: IBlock;
    transaction: ITransaction;
    net: INet;
    seeds: IPeer[];
    checkpoints: ICheckPoint[];
    hardforks: IHardfork[];
    storageVersions: IStorageVersion;
    blockFiles: IBlockFile;
    extFiles: IExtFile;
  }

  export enum ENetType {
    MAIN = 1,
    TEST,
    STAGE,
  }
}
