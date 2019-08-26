import { CNFashHash, IHash } from './types';

export class Hash {
  public static from(buffer: Buffer): IHash {
    return Buffer.from(CNFashHash(buffer), 'hex');
  }
}
