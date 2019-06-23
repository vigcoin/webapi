import * as assert from 'assert';
import { Configuration } from '../../config/types';
import { Hash } from '../../crypto/types';
import { IBlock, IBlockEntry } from '../types';
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
    return this.block.read(this.offsets[height], this.offsets[height + 1]);
  }

  get height() {
    return this.blockIndex.height;
  }
}
