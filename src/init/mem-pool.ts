import * as path from 'path';
import { Configuration } from '../config/types';
import { MemoryPool } from '../cryptonote/mem-pool';

// seconds, one day
export const CRYPTONOTE_MEMPOOL_TX_LIVETIME = 60 * 60 * 24;
// seconds, one week
export const CRYPTONOTE_MEMPOOL_TX_FROM_ALT_BLOCK_LIVETIME = 60 * 60 * 24 * 7;

// CRYPTONOTE_NUMBER_OF_PERIODS_TO_FORGET_TX_DELETED_FROM_POOL * CRYPTONOTE_MEMPOOL_TX_LIVETIME = time to forget tx
export const CRYPTONOTE_NUMBER_OF_PERIODS_TO_FORGET_TX_DELETED_FROM_POOL = 7;

export function getForgetTime(
  timeToLive: number = CRYPTONOTE_MEMPOOL_TX_LIVETIME,
  times: number = CRYPTONOTE_NUMBER_OF_PERIODS_TO_FORGET_TX_DELETED_FROM_POOL
): number {
  return timeToLive * times;
}

export function isForgetable(timeGap: number) {
  return timeGap > getForgetTime();
}

export function getLiveTime(keptByBlock: boolean) {
  return keptByBlock
    ? CRYPTONOTE_MEMPOOL_TX_FROM_ALT_BLOCK_LIVETIME
    : CRYPTONOTE_MEMPOOL_TX_LIVETIME;
}

export function getMemoryPool(dir: string, config: Configuration.IConfig) {
  const filename = path.resolve(dir, config.extFiles.pool);
  return new MemoryPool(filename);
}
