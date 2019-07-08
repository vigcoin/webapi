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
      '--allow-local-ip',
      '--hide-my-port',
      '--p2p-bind-ip',
      '3.1.13.3',
      '--p2p-bind-port',
      '10086',
      '--p2p-external-port',
      '80',
      '--add-peer',
      '192.168.0.1:8080,192.168.0.1:8081',
      '--add-priority-node',
      '192.168.0.1:1888',
      '--add-exclusive-node',
      '192.183.12.1:8080',
      '--seed-node',
      '192.168.1.2:8080,192.181.11.11:80,192.168.3.1:891',
      '--data-dir',
      './aaa',
    ]);
    assert(res.code === 0);
  });
});
