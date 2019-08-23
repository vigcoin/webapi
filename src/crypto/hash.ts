import { getFastHash } from '@vigcoin/neon';
import { IHash } from './types';

export class Hash {
  public static from(buffer: Buffer): IHash {
    return Buffer.from(getFastHash(buffer), 'hex');
  }
}
