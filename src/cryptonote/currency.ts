import { IBlock, IBlockEntry, ITransaction } from './types';
import { Configuration } from '../config/types';
import { Block } from './block';

export class Currency {
  genesisBlock: IBlock;
  genesisBlockHash: Buffer;
  config: Configuration.ICurrency;

  constructor(config: Configuration.ICurrency) {
    this.config = config;
  }

  init() {
    this.genesisBlock = Block.genesis(this.config.block);
    this.genesisBlockHash = Block.hash(this.genesisBlock);
  }

  getGenesisBlock(): IBlock {
    return this.genesisBlock;
  }

  getGenesisHash(): Buffer {
    return this.genesisBlockHash;
  }

  generateGenesisBlock() {}
  generateGenesisHash() {}
}
