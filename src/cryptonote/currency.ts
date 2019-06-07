import { Configuration } from '../config/types';
import { Block } from './block/block';
import { IBlock } from './types';

export class Currency {
  private genesisBlock: IBlock;
  private genesisBlockHash: Buffer;
  private config: Configuration.ICurrency;

  constructor(config: Configuration.ICurrency) {
    this.config = config;
  }

  public init() {
    this.genesisBlock = Block.genesis(this.config.block);
    this.genesisBlockHash = Block.hash(this.genesisBlock);
  }

  public getGenesisBlock(): IBlock {
    return this.genesisBlock;
  }

  public getGenesisHash(): Buffer {
    return this.genesisBlockHash;
  }

  // public generateGenesisBlock() {}
  // public generateGenesisHash() {}
}
