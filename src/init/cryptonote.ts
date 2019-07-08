import { Command } from 'commander';
import { Configuration } from '../config/types';
import { data as main } from './net-types/mainnet';
import { data as test } from './net-types/testnet';

export function getType(testnet: boolean) {
  if (testnet) {
    return Configuration.ENetType.TEST;
  }
  return Configuration.ENetType.MAIN;
}
export function getConfigByType(type: Configuration.ENetType) {
  switch (type) {
    case Configuration.ENetType.MAIN:
      return main;
    default:
      return test;
  }
}
