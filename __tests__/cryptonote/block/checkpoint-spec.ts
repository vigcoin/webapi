import assert = require('assert');
import { randomBytes } from 'crypto';
import { CheckPoint } from '../../../src/cryptonote/block/checkpoint';

describe('checkpoint test', () => {
  test('should test checkpoint', () => {
    const cp = new CheckPoint([]);
    const hash = randomBytes(32);
    const hash1 = randomBytes(32);
    assert(cp.add(1, hash.toString('hex')));
    assert(cp.add(2, hash1.toString('hex')));
    assert(!cp.add(2, hash1.toString('hex')));
    assert(!cp.add(3, 'xyz'));
    assert(cp.check(2, hash1));
    assert(!cp.check(2, hash));
    assert(!cp.check(5, hash));
    assert(cp.has(1));
    assert(!cp.has(5));
    assert(cp.isAllowed(1, 2));
    assert(!cp.isAllowed(1, 0));
    assert(cp.isAllowed(5, 5));
  });
});
