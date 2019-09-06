import * as assert from 'assert';
import { decompose } from '../../../src/cryptonote/transaction/util';
describe('transaction util test', () => {
  it('should decompose amout', () => {
    const decomposed = Buffer.from(decompose(1234567890123, 10000));
    assert(
      decomposed.equals(
        Buffer.from([
          90000,
          800000,
          7000000,
          60000000,
          500000000,
          4000000000,
          30000000000,
          200000000000,
          1000000000000,
          123,
        ])
      )
    );
  });

  it('should decompose amout', () => {
    const decomposed = Buffer.from(decompose(9007199254740991, 10000));
    assert(
      decomposed.equals(
        Buffer.from([
          40000,
          700000,
          4000000,
          50000000,
          200000000,
          9000000000,
          90000000000,
          100000000000,
          7000000000000,
          9000000000000000,
          991,
        ])
      )
    );
  });

  it('should decompose amout', () => {
    const decomposed = decompose(0, 10000);
    assert(!!decompose);
  });

  it('should decompose amout', () => {
    const decomposed = decompose(98, 10000);
    assert(decomposed[0] === 98);
  });

  it('should decompose amout', () => {
    const decomposed = decompose(908, 10);
    assert(decomposed[0] === 900);
    assert(decomposed[1] === 8);
  });
});
