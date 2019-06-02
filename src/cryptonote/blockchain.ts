import { Configuration } from '../config/types';

// tslint:disable-next-line:max-classes-per-file
export class BlockChain {
  public files: Configuration.IBlockFile;
  constructor(files: Configuration.IBlockFile) {
    this.files = files;
  }
}
