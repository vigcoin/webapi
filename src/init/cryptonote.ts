import { Command } from 'commander';
import { Configuration } from '../config/types';
import { data as main } from './net-types/mainnet';
import { data as test } from './net-types/testnet';

export function getType() {
  const cmd = new Command();
  cmd.option(
    'testnet',
    'Used to deploy test nets. Checkpoints and hardcoded seeds are ignored, ',
    false
  );
  cmd.parse(process.argv);
  if (cmd.testnet) {
    return Configuration.ENetType.TEST;
  }
  return Configuration.ENetType.MAIN;
}
export function getConfigByType(type: Configuration.ENetType) {
  switch (type) {
    case Configuration.ENetType.MAIN:
      return main;
      break;
    default:
      return test;
  }
}
