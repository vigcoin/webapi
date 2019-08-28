import * as assert from 'assert';
import { decompose } from '../../../src/cryptonote/transaction/util';
describe('transaction util test', () => {
  it('should decompose amout', () => {
    const decomposed = decompose(1234567890123, 10000);
    assert(decomposed.dust === 123);
    assert(decomposed.chunks[0] === 90000);
    assert(decomposed.chunks[1] === 800000);
    assert(decomposed.chunks[2] === 7000000);
    assert(decomposed.chunks[3] === 60000000);
    assert(decomposed.chunks[4] === 500000000);
    assert(decomposed.chunks[5] === 4000000000);
    assert(decomposed.chunks[6] === 30000000000);
    assert(decomposed.chunks[7] === 200000000000);
    assert(decomposed.chunks[8] === 1000000000000);
  });

  it('should decompose amout', () => {
    const decomposed = decompose(9007199254740991, 10000);
    assert(decomposed.dust === 991);
    assert(decomposed.chunks[0] === 40000);
    assert(decomposed.chunks[1] === 700000);
    assert(decomposed.chunks[2] === 4000000);
    assert(decomposed.chunks[3] === 50000000);
    assert(decomposed.chunks[4] === 200000000);
    assert(decomposed.chunks[5] === 9000000000);
    assert(decomposed.chunks[6] === 90000000000);
    assert(decomposed.chunks[7] === 100000000000);
    assert(decomposed.chunks[8] === 7000000000000);
    assert(decomposed.chunks[9] === 9000000000000000);
  });

  it('should decompose amout', () => {
    const decomposed = decompose(0, 10000);
  });
  it('should decompose amout', () => {
    const decomposed = decompose(98, 10000);
    assert(decomposed.chunks.length === 0);
    assert(decomposed.dust === 98);
  });

  it('should decompose amout', () => {
    const decomposed = decompose(908, 10);
    assert(decomposed.chunks.length === 1);
    assert(decomposed.chunks[0] === 900);
    assert(decomposed.dust === 8);
  });
});
