import * as assert from 'assert';
import { Configuration } from '../config/types';
import { BlockChain } from './block/blockchain';

export class Currency {
  // tslint:disable-next-line:variable-name
  private _genesis: Configuration.IGenesis;
  private config: Configuration.ICurrency;
  private blockchain: BlockChain;

  constructor(config: Configuration.ICurrency) {
    this.config = config;
    this.blockchain = new BlockChain(config.blockFiles);
    this.init();
  }

  private init() {
    this._genesis = BlockChain.genesis(this.config.block);
    this.blockchain.init();
    if (this.blockchain.height > 0) {
      const be = this.blockchain.get(0);
      assert.deepEqual(this._genesis.block, be.block);
    }
  }

  get genesis(): Configuration.IGenesis {
    return this._genesis;
  }

  // public generateGenesisBlock() {}
  // public generateGenesisHash() {}
}
