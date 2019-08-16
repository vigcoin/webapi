import * as assert from 'assert';
import { Configuration } from '../../config/types';
import { Hash } from '../../crypto/types';
import { IBlock, IBlockEntry, uint64 } from '../types';
import { Block } from './block';
import { BlockIndex } from './block-index';

export class BlockChain {
  public static genesis(block: Configuration.IBlock): Configuration.IGenesis {
    const genesisBlock = Block.genesis(block);
    const genesisBlockHash = Block.hash(genesisBlock);
    return {
      block: genesisBlock,
      hash: genesisBlockHash,
    };
  }

  public static hash(block: IBlock): Buffer {
    return Block.hash(block);
  }

  private files: Configuration.IBlockFile;
  private currency: Configuration.ICurrency;
  private blockIndex: BlockIndex;
  private block: Block;
  private offsets: number[];
  private initialized = false;

  constructor(config: Configuration.ICurrency) {
    this.currency = config;
    this.files = config.blockFiles;
    this.blockIndex = new BlockIndex(this.files.index);
    this.block = new Block(this.files.data);
    this.offsets = [0];
  }

  public genesis() {
    return BlockChain.genesis(this.currency.block);
  }

  public init() {
    this.blockIndex.init();
    if (!this.blockIndex.empty()) {
      const items = this.blockIndex.getOffsets();
      let offset = 0;
      for (const item of items) {
        offset += item;
        this.offsets.push(offset);
      }
    }
    this.initialized = true;
  }

  public empty(): boolean {
    return this.block.empty();
  }

  public get(index: number): IBlockEntry {
    assert(this.initialized);
    assert(index >= 0);
    assert(index < this.height);
    return this.block.read(this.offsets[index], this.offsets[index + 1]);
  }

  get height(): uint64 {
    return this.blockIndex.height;
  }

  get circulatedCoins(): uint64 {
    if (this.height < 1) {
      return 0;
    }
    const be = this.get(this.height - 1);
    return be.generatedCoins;
  }

  public have(hash: Hash): IBlockEntry {
    for (let i = this.height - 1; i > 0; i--) {
      const be = this.get(i);
      if (be.block.header.preHash.equals(hash)) {
        return this.get(i - 1);
      }
    }
  }

  public buildSparseChain() {
    const sparseChain: Hash[] = [];
    const height = this.height;
    let last = -1;

    for (let i = 1; i <= height; i *= 2) {
      last = height - i;
      const be = this.get(last);
      sparseChain.push(be.block.header.preHash);
    }

    if (last > 0) {
      const be = this.get(0);
      sparseChain.push(be.block.header.preHash);
    }
  }
}
