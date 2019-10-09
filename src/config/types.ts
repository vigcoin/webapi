import { IHash } from '../crypto/types';
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
  export interface ICVersion {
    major: number;
    minor: number;
    patch: number;
  }

  export interface ICBlock {
    genesisCoinbaseTxHex: string;
    version: ICVersion;
  }

  export interface ICTransaction {
    version: ICVersion;
  }

  export interface ICNet {
    pubKey: string;
    p2pPort: uint16;
    rpcPort: uint16;
    walletPort: uint16;
    version: ICVersion;
  }

  export interface ICCheckPoint {
    height: uint32;
    blockId: string;
  }

  export interface ICBlockFile {
    data: string;
    index: string;
    cache: string;
    chain: string;
  }

  export interface ICExtFile {
    pool: string;
    p2p: string;
    miner: string;
  }

  export interface ICHardfork {
    version: uint8;
    height: uint64;
    threshold: uint8;
    time: Date;
  }

  export interface ICStorageVersion {
    blockCacheArchive: ICVersion;
    blockCacheIndicesArchive: ICVersion;
  }

  export interface ICCurrency {
    block: ICBlock;
    blockFiles: ICBlockFile;
    hardfork: ICHardfork[];
  }

  export interface IGenesis {
    block: IBlockTypes;
    hash: IHash;
  }

  export interface IConfig {
    name: string;
    createTime: Date;
    block: ICBlock;
    transaction: ICTransaction;
    net: ICNet;
    seeds: IPeer[];
    checkpoints: ICCheckPoint[];
    hardforks: ICHardfork[];
    storageVersions: ICStorageVersion;
    blockFiles: ICBlockFile;
    extFiles: ICExtFile;
  }

  export enum ENetType {
    MAIN = 1,
    TEST,
    STAGE,
  }
}
