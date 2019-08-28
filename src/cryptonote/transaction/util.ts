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
  return {
    chunks,
    dust,
  };
}
