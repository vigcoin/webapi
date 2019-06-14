import * as assert from 'assert';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import {
  BIN_KV_SERIALIZE_FLAG_ARRAY,
  BIN_KV_SERIALIZE_TYPE_BOOL,
  BIN_KV_SERIALIZE_TYPE_DOUBLE,
  BIN_KV_SERIALIZE_TYPE_INT16,
  BIN_KV_SERIALIZE_TYPE_INT32,
  BIN_KV_SERIALIZE_TYPE_INT64,
  BIN_KV_SERIALIZE_TYPE_INT8,
  BIN_KV_SERIALIZE_TYPE_OBJECT,
  BIN_KV_SERIALIZE_TYPE_STRING,
  BIN_KV_SERIALIZE_TYPE_UINT16,
  BIN_KV_SERIALIZE_TYPE_UINT32,
  BIN_KV_SERIALIZE_TYPE_UINT64,
  BIN_KV_SERIALIZE_TYPE_UINT8,
  readJSON,
  readJSONArray,
  readJSONObject,
  readJSONValue,
  readJSONVarint,
  writeJSON,
  writeJSONVarint,
} from '../../src/p2p/protocol/json';

describe('test json stream', () => {
  test('should read varint uint8 from stream', async () => {
    const buffer = Buffer.from([0]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONVarint(reader);
    assert(value === 0);
  });

  test('should write varint uint8 to stream', async () => {
    const buffer = Buffer.from([]);
    const writer = new BufferStreamWriter(buffer);
    writeJSONVarint(writer, 0);
    assert(writer.getBuffer().equals(Buffer.from([0])));
  });

  test('should read varint uint16 from stream', async () => {
    const buffer = Buffer.from([1, 1]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONVarint(reader);
    assert(value === 64);
  });

  test('should write varint uint16 to stream', async () => {
    const buffer = Buffer.from([]);
    const writer = new BufferStreamWriter(buffer);
    writeJSONVarint(writer, 64);
    assert(writer.getBuffer().equals(Buffer.from([1, 1])));
  });

  test('should read varint uint32 from stream', async () => {
    const buffer = Buffer.from([2, 1, 1, 1]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONVarint(reader);
    assert(value === 4210752);
  });

  test('should write varint uint32 to stream', async () => {
    const buffer = Buffer.from([]);
    const writer = new BufferStreamWriter(buffer);
    writeJSONVarint(writer, 4210752);
    assert(writer.getBuffer().equals(Buffer.from([2, 1, 1, 1])));
  });

  test('should read varint uint64 from stream', async () => {
    const buffer = Buffer.from([3, 1, 1, 1, 2, 3, 4, 5]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONVarint(reader);
    assert(value === 21053632);
  });

  test('should write varint uint64 to stream', async () => {
    const buffer = Buffer.from([]);
    const writer = new BufferStreamWriter(buffer);
    writeJSONVarint(writer, 21053632);
  });

  test('should read json value int8 from stream', async () => {
    const buffer = Buffer.from([0xff]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT8);
    assert(value === -1);
  });

  test('should read json value int8 from stream', async () => {
    const buffer = Buffer.from([3]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT8);
    assert(value === 3);
  });

  test('should read json value uint8 from stream', async () => {
    const buffer = Buffer.from([3]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT8);
    assert(value === 3);
  });

  test('should read json value uint8 from stream', async () => {
    const buffer = Buffer.from([0xff]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT8);
    assert(value === 255);
  });

  test('should read json value int16 from stream', async () => {
    const buffer = Buffer.from([0xff, 0xff]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT16);
    assert(value === -1);
  });

  test('should read json value int16 from stream', async () => {
    const buffer = Buffer.from([1, 1]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT16);
    assert(value === 257);
  });

  test('should read json value uint16 from stream', async () => {
    const buffer = Buffer.from([1, 1]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT16);
    assert(value === 257);
  });

  test('should read json value uint16 from stream', async () => {
    const buffer = Buffer.from([0xff, 0xff]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT16);
    assert(value === 65535);
  });

  test('should read json value int32 from stream', async () => {
    const buffer = Buffer.from([0xff, 0xff, 0xff, 0xff]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT32);
    assert(value === -1);
  });

  test('should read json value int32 from stream', async () => {
    const buffer = Buffer.from([0, 0, 0, 0]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT32);
    assert(value === 0);
  });

  test('should read json value uint32 from stream', async () => {
    const buffer = Buffer.from([0xff, 0xff, 0xff, 0xff]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT32);
    assert(value === 0xffffffff);
  });

  test('should read json value uint32 from stream', async () => {
    const buffer = Buffer.from([0, 0, 0, 0]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT32);
    assert(value === 0);
  });

  test('should read json value int64 from stream', async () => {
    const buffer = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT64);
    assert(value.equals(buffer));
  });

  test('should read json value uint64 from stream', async () => {
    const buffer = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT64);
    assert(value.equals(buffer));
  });

  test('should read json value double from stream', async () => {
    const buffer = Buffer.from([0, 2, 3, 4, 5, 6, 7, 8]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_DOUBLE);

    assert(value !== 0);
  });

  test('should read json value boolean from stream', async () => {
    const buffer = Buffer.from([0]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_BOOL);
    assert(value === false);
  });

  test('should read json value boolean from stream', async () => {
    const buffer = Buffer.from([1]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_BOOL);
    assert(value === true);
  });

  test('should read json value string from stream', async () => {
    // tslint:disable-next-line:no-bitwise
    const buffer = Buffer.from([1 << 2, 97]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_STRING);
    assert(value === 'a');
  });

  test('should read json value Error', async () => {
    // tslint:disable-next-line:no-bitwise
    const buffer = Buffer.from([1 << 2, 97]);
    const reader = new BufferStreamReader(buffer);
    let catched = false;
    try {
      const value = readJSONValue(reader, 200);
    } catch (e) {
      catched = true;
    }
    assert(catched);
  });

  test('should read json array from stream', async () => {
    // tslint:disable-next-line:no-bitwise
    const buffer = Buffer.from([1 << 2, 97]);
    const reader = new BufferStreamReader(buffer);
    const array = readJSONArray(reader, BIN_KV_SERIALIZE_TYPE_UINT8);
    assert(array.length === 1);
    assert(array[0] === 97);
  });

  test('should read json array from stream', async () => {
    // tslint:disable-next-line:no-bitwise
    const buffer = Buffer.from([2 << 2, 97, 98]);
    const reader = new BufferStreamReader(buffer);
    const array = readJSONArray(reader, BIN_KV_SERIALIZE_TYPE_UINT8);
    assert(array.length === 2);
    assert(array[0] === 97);
    assert(array[1] === 98);
  });

  test('should read json object from stream', async () => {
    // tslint:disable-next-line:no-bitwise
    const buffer = Buffer.from([BIN_KV_SERIALIZE_TYPE_INT8, 97]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_OBJECT);
    assert(value === 97);
  });

  test('should read json object array from stream', async () => {
    // tslint:disable-next-line:no-bitwise
    const buffer = Buffer.from([
      // tslint:disable-next-line:no-bitwise
      BIN_KV_SERIALIZE_TYPE_INT8 | BIN_KV_SERIALIZE_FLAG_ARRAY,
      // tslint:disable-next-line:no-bitwise
      2 << 2,
      97,
      98,
    ]);
    const reader = new BufferStreamReader(buffer);
    const array = readJSONObject(reader);
    assert(array.length === 2);
    assert(array[0] === 97);
    assert(array[1] === 98);
  });

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
    const json: any = readJSON(stream);
    assert(json.status === 'OK');
    const newPeerId = new Buffer([
      0xbc,
      0xab,
      0x85,
      0x2d,
      0xff,
      0x41,
      0xcb,
      0x9f,
    ]);
    assert(newPeerId.equals(json.peer_id));
  });

  test('should write json stream', async () => {
    const stream = new BufferStreamWriter(Buffer.from([]));
    const zero = [0x01, 0x011, 0x01, 0x01, 0x01, 0x01, 0x02, 0x01, 0x01, 0x00];
    writeJSON(stream, JSON.parse('{}'));
    assert(stream.getBuffer().equals(Buffer.from(zero)));
  });
});
