import * as assert from 'assert';
import { readBufferDate } from '../../src/util/time';

describe('test time', () => {
  it('should get time from buffer', async () => {
    const buffer = Buffer.alloc(8);
    const now = parseInt((new Date().getTime() / 1000).toFixed(0), 10);
    buffer.writeUInt32LE(now, 0);
    buffer.writeUInt32LE(0, 4);
    const time = readBufferDate(buffer, 0).getTime() / 1000;
    assert(now === time);
  });
});
