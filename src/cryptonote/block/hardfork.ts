import { Configuration, IBlock, uint64, uint8 } from '@vigcoin/types';

export class Hardfork {
  private items: Configuration.ICHardfork[];

  constructor(items: Configuration.ICHardfork[]) {
    this.items = items;
  }

  public getVariant(b: IBlock) {
    return b.header.version.major >= 7 ? b.header.version.major - 6 : 0;
  }

  public getMajorVersion(height: uint64): uint8 {
    let version = 1;
    for (const item of this.items) {
      if (item.height > height) {
        break;
      }
      version = item.version;
    }
    return version;
  }

  public getMinorVersion(height: uint64): uint8 {
    return 0;
  }
}
