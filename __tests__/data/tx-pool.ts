import * as assert from 'assert';
export const buffer = Buffer.from([
  0x01,
  0x11,
  0x01,
  0x01,
  0x01,
  0x01,
  0x02,
  0x01,
  0x01,
  0x00,
]);

describe('command tx pool', () => {
  it('should have tx pool buffer', () => {
    assert(buffer);
  });
});
