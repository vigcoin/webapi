import { HASH_LENGTH } from '@vigcoin/crypto';
import assert = require('assert');
import { PurgeZeroByte } from '../src/cryptonote/serialize/common';
import { BufferStreamReader } from '../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../src/cryptonote/serialize/writer';

describe('test serializer', () => {
  test('Should write/read types and Buffer', async () => {
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    // tslint:disable-next-line:no-bitwise
    const uint8 = 1 << 7;
    const uint16 = 0xffff;
    const uint32 = 0xffffffff;
    const t = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
    const d = new Date();
    const b = Buffer.from([1, 2, 3]);
    const h = Buffer.alloc(HASH_LENGTH);
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
    assert(t.equals(reader.readUInt64()));
    assert(t.equals(reader.readInt64()));
    const nd = reader.readDate();
    assert(Math.floor(d.getTime() / 1000) === Math.floor(nd.getTime() / 1000));
    const b1 = reader.read(b.length);
    const h1 = reader.readHash();
    assert(reader.getRemainedSize() === 0);
    assert(b1.equals(b));
    assert(h1.equals(h));
  });

  test('Should purge zero buffer', async () => {
    const buffer = PurgeZeroByte(Buffer.from([0, 0, 0]));
    assert(buffer.length === 1);
    const buffer1 = PurgeZeroByte(Buffer.from([1, 0, 0]));
    assert(buffer1.length === 1);
    const buffer2 = PurgeZeroByte(Buffer.from([0, 1, 0]));
    assert(buffer2.length === 2);
    const buffer3 = PurgeZeroByte(Buffer.from([0, 0, 1]));
    assert(buffer3.length === 3);
  });

  test('Should shift buffer', async () => {
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    const buffer = writer.shiftBuffer(Buffer.from([0xaa, 0xbb]));
    buffer.equals(Buffer.from([0x55, 0x01]));
    const buffer1 = writer.shiftBuffer(Buffer.from([0x55, 0x01]));
    buffer1.equals(Buffer.from([2]));
  });

  test('Should read / write varint buffer', async () => {
    const data = [213, 164, 154, 246, 225, 215, 225, 153, 56];

    const reader = new BufferStreamReader(Buffer.from(data));
    const buffer = reader.readVarintBuffer();
    assert(
      buffer.equals(
        Buffer.from([0x55, 0x92, 0xc6, 0x1e, 0xbe, 0x86, 0x33, 0x38])
      )
    );
    const writer = new BufferStreamWriter(Buffer.from([]));
    writer.writeVarintBuffer(
      Buffer.from([0x55, 0x92, 0xc6, 0x1e, 0xbe, 0x86, 0x33, 0x38])
    );
    const varint = writer.getBuffer();
    assert(varint.equals(Buffer.from(data)));
  });

  test('Should read / write varint buffer', async () => {
    const data = [0];

    const reader = new BufferStreamReader(Buffer.from(data));
    const buffer = reader.readVarintBuffer();
    assert(buffer.equals(Buffer.from([0])));
    const writer = new BufferStreamWriter(Buffer.from([]));
    writer.writeVarintBuffer(Buffer.from([0]));
    const varint = writer.getBuffer();
    assert(varint.equals(Buffer.from(data)));
  });

  test('Should read / write varint uint64', async () => {
    const writer = new BufferStreamWriter(Buffer.from([]));
    writer.writeVarintBuffer(Buffer.from([1, 2]));
    const varint = writer.getBuffer();

    const reader = new BufferStreamReader(varint);
    const buffer = reader.readVarintUInt64();
    assert(buffer.equals(Buffer.from([1, 2, 0, 0, 0, 0, 0, 0])));
  });

  test('Should read / write varint uint64', async () => {
    const writer = new BufferStreamWriter(Buffer.from([]));
    writer.writeVarintBuffer(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const varint = writer.getBuffer();

    const reader = new BufferStreamReader(varint);
    let catched = false;
    try {
      const buffer = reader.readVarintUInt64();
    } catch (e) {
      catched = true;
    }
    assert(catched);
  });

  test('Should write/read varint 1', async () => {
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    writer.writeVarint(1);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(1 === reader.readVarint());
  });

  test('Should write/read varint 128', async () => {
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    writer.writeVarint(128);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(128 === reader.readVarint());
  });

  test('Should write/read varint 129', async () => {
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    writer.writeVarint(129);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(129 === reader.readVarint());
  });

  test('Should write/read varint unit32', async () => {
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    writer.writeVarint(0xffff);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(0xffff === reader.readVarint());
  });

  test('Should write/read varint unit63', async () => {
    const t = new Date().getDate();
    const writer = new BufferStreamWriter(Buffer.alloc(8));
    writer.writeVarint(t);
    const reader = new BufferStreamReader(writer.getBuffer());
    assert(t === reader.readVarint());
  });

  test('Should get shift value', async () => {
    const reader = new BufferStreamReader(Buffer.alloc(0));
    assert(268435456 === reader.getShiftValue(28, 1));
    assert(536870912 === reader.getShiftValue(28, 2));
    const buffer = reader.getBuffer();
    assert(buffer.length === 0);
  });
});
