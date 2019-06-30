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
  private blockIndex: BlockIndex;
  private block: Block;
  private offsets: number[];
  private initialized = false;

  constructor(files: Configuration.IBlockFile) {
    this.files = files;
    this.blockIndex = new BlockIndex(files.index);
    this.block = new Block(files.data);
    this.offsets = [0];
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
  public get(height: number): IBlockEntry {
    assert(this.initialized);
    assert(height >= 0);
    assert(height <= this.height);
    return this.block.read(this.offsets[height], this.offsets[height + 1]);
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

  public have(hash: Buffer): IBlockEntry {
    for (let i = this.height - 1; i > 0; i--) {
      const be = this.get(i);
      console.log(be);
      if (be.block.header.preHash.equals(hash)) {
        return this.get(i - 1);
      }
    }
  }
}
