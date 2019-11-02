import * as assert from 'assert';
import { parameters } from '../../src/config';
import { Difficulty } from '../../src/cryptonote/difficulty';

describe('test difficulty', () => {
  it('should get block count', () => {
    const blockCount = Difficulty.blocksCount();
    assert(
      blockCount === parameters.DIFFICULTY_CUT + parameters.DIFFICULTY_LAG
    );
  });
});
