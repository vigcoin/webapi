import * as assert from 'assert';
import { exec } from 'child_process';
import * as path from 'path';
import { getConfigByType, getType } from '../src/init/cryptonote';
import { data as main } from '../src/init/net-types/mainnet';
import { data as test } from '../src/init/net-types/testnet';

function cli(filename, args) {
  return new Promise(resolve => {
    exec(`ts-node ${filename} ${args.join(' ')}`, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        // tslint:disable-next-line:object-literal-sort-keys
        stderr,
      });
    });
  });
}

describe('test config', () => {
  it('Should get test by type', () => {
    assert.deepEqual(getConfigByType(getType(true)), test);
  });
  it('Should get main by type', () => {
    assert.deepEqual(getConfigByType(getType(false)), main);
  });

  it('should test cli', async () => {
    const res: any = await cli(path.resolve(__dirname, '../src/cli/p2p.ts'), [
      '--testnet',
    ]);
    assert(res.code === 0);
  });
});
