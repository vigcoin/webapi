import * as assert from 'assert';
import { TransactionAmount } from '../../../src/cryptonote/transaction/amount';
describe('transaction amount test', () => {
  it('should format amount', () => {
    const formated = TransactionAmount.format(1234567890123);
    assert(formated === '12345.67890123');

    const formated1 = TransactionAmount.format(890123);
    assert(formated1 === '0.00890123');

    const formated2 = TransactionAmount.format(Number.MAX_SAFE_INTEGER + 1);
    assert(formated2 === undefined);
  });
});
