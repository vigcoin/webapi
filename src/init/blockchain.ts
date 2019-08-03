import { Configuration } from '../config/types';
import { BlockChain } from '../cryptonote/block/blockchain';
import { getBlockFile, getDefaultAppDir } from '../util/fs';

export function getBlockChain(
  config: Configuration.ICurrency
  // files: Configuration.IBlockFile = getBlockFile(getDefaultAppDir())
) {
  return new BlockChain(config);
}

export function getBlockChainInitialized(
  dir: string,
  config: Configuration.IConfig
) {
  const files: Configuration.IBlockFile = getBlockFile(dir, config);
  const currency: Configuration.ICurrency = {
    block: {
      genesisCoinbaseTxHex: config.block.genesisCoinbaseTxHex,
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    },
    blockFiles: files,
    hardfork: [],
  };
  const blc = getBlockChain(currency);
  blc.init();
  return blc;
}
