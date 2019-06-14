import { HASH_LENGTH } from '../src/crypto/types';
import { BufferStreamReader } from '../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../src/cryptonote/serialize/writer';
import assert = require('assert');
import { read } from 'fs';

describe('test serializer', () => {
  test('Should write/read types and Buffer', async () => {
    const writer = new BufferStreamWriter(new Buffer(8));
    // tslint:disable-next-line:no-bitwise
    const uint8 = 1 << 7;
    const uint16 = 0xffff;
    const uint32 = 0xffffffff;
    const t = new Date().getDate();
    const d = new Date();
    const b = new Buffer([1, 2, 3]);
    const h = new Buffer(HASH_LENGTH);
    h[1] = 1;
    h[3] = 2;
    writer.writeUInt8(uint8);
    writer.writeInt8(-1);
    writer.writeUInt16(uint16);
    writer.writeInt16(-1);
    writer.writeUInt32(uint32);
    writer.writeInt32(-1);
    writer.writeUInt64(t);
    writer.writeInt64(t);
    writer.writeDate(d);
    writer.write(b);
    writer.writeHash(h);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(reader.getRemainedSize() === reader.getBuffer().length);
    assert(uint8 === reader.readUInt8());
    assert(-1 === reader.readInt8());
    assert(uint16 === reader.readUInt16());
    assert(-1 === reader.readInt16());
    assert(uint32 === reader.readUInt32());
    assert(-1 === reader.readInt32());
    assert(t === reader.readUInt64());
    assert(t === reader.readInt64());
    assert(d.getTime() === reader.readDate().getTime());
    const b1 = reader.read(b.length);
    const h1 = reader.readHash();
    assert(reader.getRemainedSize() === 0);
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

  test('Should get shift value', async () => {
    const reader = new BufferStreamReader(new Buffer(0));
    assert(268435456 === reader.getShiftValue(28, 1));
    assert(536870912 === reader.getShiftValue(28, 2));
    const buffer = reader.getBuffer();
    assert(buffer.length === 0);
  });
});
