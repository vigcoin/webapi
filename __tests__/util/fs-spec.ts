import * as assert from 'assert';
import * as path from 'path';
import { getBlockFile, getDefaultAppDir } from '../../src/util/fs';

import * as rm from 'rimraf';
import { promisify } from 'util';
import { Configuration } from '../../src/config/types';

import { data } from '../../src/init/net-types/testnet';

describe('test fs', () => {
  test('Should get files from dir of none existance', async () => {
    const dir = path.resolve(__dirname, '../tmp');
    const rma = promisify(rm);
    await rma(dir);
    const files = getBlockFile(dir, data);
    assert(files.cache);
    assert(files.cache.indexOf(dir) !== -1);
    await rma(dir);
  });

  test('Should get env', async () => {
    const dir = path.resolve(__dirname, '../tmp');
    const home = getDefaultAppDir();
    assert(home.indexOf(dir) === -1);
    process.env.APPDATA = dir;
    const appDir = getDefaultAppDir();
    assert(appDir.indexOf(dir) !== -1);
    const appDir1 = getDefaultAppDir('devcoin');
    assert(appDir1.indexOf('devcoin') !== -1);
  });
});
