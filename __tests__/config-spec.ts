import * as assert from 'assert';
import { spawn } from 'child_process';
import { getConfigByType, getType } from '../src/init/cryptonote';
import { data as main } from '../src/init/net-types/mainnet';
import { data as test } from '../src/init/net-types/testnet';

describe('test config', () => {
  it('Should get config by type', () => {
    assert.deepEqual(getConfigByType(getType(process.argv)), main);
  });

  it('Should get config by type', () => {
    assert.deepEqual(
      getConfigByType(getType(process.argv.concat(['--testnet', 'true']))),
      test
    );
  });
});
