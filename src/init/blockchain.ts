import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { Configuration } from '../config/types';
import { BlockChain } from '../cryptonote/block/blockchain';

export function getBlockFile(dir: string): Configuration.IBlockFile {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  const indexFile = path.resolve(dir, './blockindexes.dat');
  const blockFile = path.resolve(dir, './blocks.dat');
  const chainFile = path.resolve(dir, './blockchainindices.dat');
  const cacheFile = path.resolve(dir, './blockscache.dat');

  return {
    data: blockFile,
    index: indexFile,
    // tslint:disable-next-line:object-literal-sort-keys
    chain: chainFile,
    cache: cacheFile,
  };
}

export function getDefaultAppDir(appName: string = 'vigcoin'): string {
  if (process.env.APPDATA) {
    return path.resolve(process.env.APPDATA, './' + appName);
  }
  return path.resolve(process.env.HOME, './.' + appName);
}

export function getBlockChain(
  files: Configuration.IBlockFile = getBlockFile(getDefaultAppDir())
) {
  return new BlockChain(files);
}
