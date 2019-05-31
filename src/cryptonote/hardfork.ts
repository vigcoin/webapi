import { Configuration } from '../config/types';
import { IBlock } from './types';

export class Hardfork {
  items: Configuration.IHardfork[];
  constructor(items: Configuration.IHardfork[]) {
    this.items = items;
  }

  public static getVariant(b: IBlock) {
    return b.header.version.major >= 7 ? b.header.version.major - 6 : 0;
  }
}
