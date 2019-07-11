import * as assert from 'assert';
import { getConfigByType, getType } from '../src/init/cryptonote';
import { data as main } from '../src/init/net-types/mainnet';
import { data as test } from '../src/init/net-types/testnet';

describe('test config', () => {
  it('Should get test by type', () => {
    assert.deepEqual(getConfigByType(getType(true)), test);
  });
  it('Should get main by type', () => {
    assert.deepEqual(getConfigByType(getType(false)), main);
  });
});
