import { Configuration } from '../config/types';
import { IBlock } from './types';

export class Hardfork {
  public static getVariant(b: IBlock) {
    return b.header.version.major >= 7 ? b.header.version.major - 6 : 0;
  }

  private items: Configuration.IHardfork[];

  constructor(items: Configuration.IHardfork[]) {
    this.items = items;
  }
}
