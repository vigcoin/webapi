import * as assert from 'assert';
import { TransactionOutput } from '../../../src/cryptonote/transaction/output';
import { buffer } from '../../data/response-chain';

describe('transaction output test', () => {
  it('should be able to convert from relative to absolute and vise verse', () => {
    const offsets = [1, 2, 3, 4];
    const absolute = TransactionOutput.toAbsolute(offsets);

    assert(Buffer.from(absolute).equals(Buffer.from([1, 3, 6, 10])));
    const relative = TransactionOutput.toRelative(absolute);
    assert(Buffer.from(relative).equals(Buffer.from(offsets)));

    assert(TransactionOutput.toAbsolute([]).length === 0);
    assert(TransactionOutput.toRelative([]).length === 0);
  });
});
