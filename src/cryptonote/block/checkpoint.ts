import { HASH_LENGTH, IHash } from '../../crypto/types';
import { logger } from '../../logger';
import { uint64 } from '../types';

export class CheckPoint {
  private points: Map<uint64, IHash> = new Map();

  public add(height: uint64, hashStr: string): boolean {
    const hash = Buffer.from(hashStr, 'hex');
    if (hash.length !== HASH_LENGTH) {
      logger.error('Wrong Hash In Checkpoints!');
      return false;
    }
    if (this.points.has(height)) {
      logger.error('Hash Existed!');
      return false;
    }
    this.points.set(height, hash);
    return true;
  }

  public has(height: uint64): boolean {
    return this.points.has(height);
  }

  public check(height: uint64, hash: IHash): boolean {
    if (!this.points.has(height)) {
      return false;
    }
    return hash.equals(this.points.get(height));
  }

  public isAllowed(blockchainHeight: uint64, blockHeight: uint64) {
    if (!blockHeight) {
      return false;
    }
    let mostMatchKey = 0;
    let mostSmallDiff = 300000; // Init with max block height
    for (const [key] of this.points) {
      const diff = Math.abs(blockchainHeight - key);
      if (diff < mostSmallDiff) {
        mostSmallDiff = diff;
        mostMatchKey = key;
      }
    }
    return mostMatchKey < blockHeight;
  }
}
