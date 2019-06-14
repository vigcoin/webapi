import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { readJSON } from '../../src/p2p/protocol/json';

describe('test json stream', () => {
  test('should read json stream', async () => {
    const buffer = [
      0x01,
      0x11,
      0x01,
      0x01,
      0x01,
      0x01,
      0x02,
      0x01,
      0x01,
      0x08,
      0x06,
      0x73,
      0x74,
      0x61,
      0x74,
      0x75,
      0x73,
      0x0a,
      0x08,
      0x4f,
      0x4b,
      0x07,
      0x70,
      0x65,
      0x65,
      0x72,
      0x5f,
      0x69,
      0x64,
      0x05,
      0xbc,
      0xab,
      0x85,
      0x2d,
      0xff,
      0x41,
      0xcb,
      0x9f,
    ];
    const stream = new BufferStreamReader(Buffer.from(buffer));
    const json = readJSON(stream);
    console.log(json);
  });
});
