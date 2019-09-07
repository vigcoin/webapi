import { parameters } from '../../config';
import { unixNow } from '../../util/time';
import { uint32, uint64 } from '../types';

export function decompose(amount: uint64, dustThreshould: uint32) {
  if (amount === 0) {
    return;
  }
  let dust: uint64 = 0;
  let powerOfTen: uint64 = 1;
  const chunks = [];
  while (amount > 0) {
    const chunk = (amount % 10) * powerOfTen;
    amount = Math.floor(amount / 10);
    powerOfTen *= 10;
    if (dust + chunk <= dustThreshould) {
      dust += chunk;
      continue;
    }
    // Chunk can't be zero to be here
    chunks.push(chunk);
  }
  chunks.push(dust);
  return chunks;
}

export function isTxUnlock(unlockTime: uint64, height: uint64) {
  if (unlockTime < parameters.CRYPTONOTE_MAX_BLOCK_NUMBER) {
    // Interpreted as block index
    const blockHeight =
      height - 1 + parameters.CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_BLOCKS;
    if (blockHeight >= unlockTime) {
      return true;
    }
    return false;
  } else {
    // Interpreted as time
    const currentTime = unixNow();
    if (
      currentTime + parameters.CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_SECONDS >=
      unlockTime
    ) {
      return true;
    }
    return false;
  }
}
