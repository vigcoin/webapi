import * as assert from 'assert';
import { existsSync, unlinkSync } from 'fs';
import * as path from 'path';
import { getBlockFile, getDefaultAppDir } from '../../src/util/fs';

import * as rm from 'rimraf';
import { promisify } from 'util';

describe('test fs', () => {
  test('Should get files from dir of none existance', async () => {
    const dir = path.resolve(__dirname, '../tmp');
    const rma = promisify(rm);
    await rma(dir);
    const files = getBlockFile(dir);
    assert(files.cache);
    assert(files.cache.indexOf(dir) !== -1);
    await rma(dir);
  });

  test('Should get env', async () => {
    const dir = path.resolve(__dirname, '../tmp');
    process.env.APPDATA = dir;
    const appDir = getDefaultAppDir();
    assert(appDir.indexOf(dir) !== -1);
    const appDir1 = getDefaultAppDir('devcoin');
    assert(appDir1.indexOf('devcoin') !== -1);
  });
});
