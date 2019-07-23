import { existsSync, mkdirSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { Configuration } from '../config/types';

export function getBlockFile(
  dir: string,
  config: Configuration.IConfig
): Configuration.IBlockFile {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  const files = _.clone(config.blockFiles);
  for (const key of Object.keys(config.blockFiles)) {
    files[key] = path.resolve(dir, config.blockFiles[key]);
  }
  return files;
}

export function getDefaultAppDir(appName: string = 'vigcoin'): string {
  if (process.env.APPDATA) {
    return path.resolve(process.env.APPDATA, './' + appName);
  }
  return path.resolve(process.env.HOME, './.' + appName);
}
