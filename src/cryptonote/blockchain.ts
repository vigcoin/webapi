import { Configuration } from '../config/types';
import { BlockIndex } from './block-index';
import { Block } from './block';

// tslint:disable-next-line:max-classes-per-file
export class BlockChain {
  private files: Configuration.IBlockFile;
  private index: BlockIndex;
  constructor(files: Configuration.IBlockFile) {
    this.files = files;
    this.index = new BlockIndex(files.index);
  }

  public init() {
    this.index.init();
    if (this.index.empty()) {
    }
  }
}
