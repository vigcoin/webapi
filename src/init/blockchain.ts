import { Configuration } from '../config/types';
import { BlockChain } from '../cryptonote/block/blockchain';
import { getBlockFile, getDefaultAppDir } from '../util/fs';

export function getBlockChain(
  files: Configuration.IBlockFile = getBlockFile(getDefaultAppDir())
) {
  return new BlockChain(files);
}
