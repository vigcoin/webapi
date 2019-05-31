import { HASH_LENGTH } from '../src/crypto/types';
import { BufferStreamReader } from '../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../src/cryptonote/serialize/writer';
import assert = require('assert');

describe('test serializer', () => {
  test('Should write/read types and Buffer', async () => {
    const writer = new BufferStreamWriter(new Buffer(8));
    const uint8 = 1 << 7;
    const uint32 = 0xffffffff;
    const t = new Date().getDate();
    const b = new Buffer([1, 2, 3]);
    const h = new Buffer(HASH_LENGTH);
    h[1] = 1;
    h[3] = 2;
    writer.writeUInt8(uint8);
    writer.writeUInt32(uint32);
    writer.writeUInt64(t);
    writer.write(b);
    writer.writeHash(h);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(uint8 === reader.readUInt8());
    assert(uint32 === reader.readUInt32());
    assert(t === reader.readUInt64());
    const b1 = reader.read(b.length);
    const h1 = reader.readHash();
    assert(b1.equals(b));
    assert(h1.equals(h));
  });

  test('Should write/read varint 1', async () => {
    const writer = new BufferStreamWriter(new Buffer(8));
    writer.writeVarint(1);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(1 === reader.readVarint());
  });

  test('Should write/read varint 128', async () => {
    const writer = new BufferStreamWriter(new Buffer(8));
    writer.writeVarint(128);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(128 === reader.readVarint());
  });

  test('Should write/read varint 129', async () => {
    const writer = new BufferStreamWriter(new Buffer(8));
    writer.writeVarint(129);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(129 === reader.readVarint());
  });

  test('Should write/read varint unit32', async () => {
    const writer = new BufferStreamWriter(new Buffer(8));
    writer.writeVarint(0xffff);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(0xffff === reader.readVarint());
  });

  test('Should write/read varint unit63', async () => {
    const t = new Date().getDate();
    const writer = new BufferStreamWriter(new Buffer(8));
    writer.writeVarint(t);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(t === reader.readVarint());
  });
});
