import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { LevinProtocol } from '../../src/p2p/levin';
import * as assert from 'assert';
describe('test levin protocol', () => {
  it('should read header', () => {
    const data = [
      0x01,
      0x21,
      0x01,
      0x01,
      0x01,
      0x01,
      0x01,
      0x01,
      0xbb,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0xe9,
      0x03,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
    ];
    const reader = new BufferStreamReader(Buffer.from(data));
    const header = LevinProtocol.readHeader(reader);
    assert(header.size === 187);
    assert(header.command === 1001);
    assert(header.flags === 1);
    assert(header.reply === true);
    assert(header.version === 1);
    assert(header.code === 0);
  });
});
