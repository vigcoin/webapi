import * as assert from 'assert';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import { handshake } from '../../src/p2p/protocol/handshake';
import { ping } from '../../src/p2p/protocol/ping';
import { timedsync } from '../../src/p2p/protocol/timedsync';

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
  readJSONObjectValue,
  readJSONValue,
  readJSONVarint,
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
    assert(String(value) === 'a');
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
    const buffer = Buffer.from([0]);
    const reader = new BufferStreamReader(buffer);
    const value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_OBJECT);
    assert(Object.keys(value).length === 0);
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
    const array = readJSONObjectValue(reader);
    assert(array.length === 2);
    assert(array[0] === 97);
    assert(array[1] === 98);
  });

  test('should read PING::ID json stream', async () => {
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
    assert(String(json.status) === 'OK');
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

  test('should write/read ping request stream', async () => {
    const data: ping.IRequest = {};
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    ping.Writer.request(writer, data);

    const reader = new BufferStreamReader(writer.getBuffer());
    const json = ping.Reader.request(reader);
    assert(Object.keys(json).length === 0);
  });

  test('should write/read ping response stream', async () => {
    const data: ping.IResponse = {
      status: 'OK',
      // tslint:disable-next-line:object-literal-sort-keys
      peerId: 0x18383832929,
    };
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    ping.Writer.response(writer, data);

    const reader = new BufferStreamReader(writer.getBuffer());
    const json = ping.Reader.response(reader);
    assert(String(json.status) === 'OK');
    assert(json.peerId === 0x18383832929);
  });

  test('should write handshake request stream', async () => {
    const data = [
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
      0x09,
      0x6e,
      0x6f,
      0x64,
      0x65,
      0x5f,
      0x64,
      0x61,
      0x74,
      0x61,
      0x0c,
      0x14,
      0x0a,
      0x6e,
      0x65,
      0x74,
      0x77,
      0x6f,
      0x72,
      0x6b,
      0x5f,
      0x69,
      0x64,
      0x0a,
      0x40,
      0x43,
      0x52,
      0x59,
      0x50,
      0x54,
      0x4f,
      0x4e,
      0x43,
      0xf4,
      0xe5,
      0x30,
      0xc2,
      0xb0,
      0x19,
      0x01,
      0x10,
      0x07,
      0x76,
      0x65,
      0x72,
      0x73,
      0x69,
      0x6f,
      0x6e,
      0x08,
      0x01,
      0x07,
      0x70,
      0x65,
      0x65,
      0x72,
      0x5f,
      0x69,
      0x64,
      0x05,
      0xdf,
      0xc4,
      0x70,
      0x18,
      0xf3,
      0x09,
      0x88,
      0xb6,
      0x0a,
      0x6c,
      0x6f,
      0x63,
      0x61,
      0x6c,
      0x5f,
      0x74,
      0x69,
      0x6d,
      0x65,
      0x05,
      0x08,
      0xc0,
      0x08,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0x07,
      0x6d,
      0x79,
      0x5f,
      0x70,
      0x6f,
      0x72,
      0x74,
      0x06,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x0c,
      0x70,
      0x61,
      0x79,
      0x6c,
      0x6f,
      0x61,
      0x64,
      0x5f,
      0x64,
      0x61,
      0x74,
      0x61,
      0x0c,
      0x08,
      0x0e,
      0x63,
      0x75,
      0x72,
      0x72,
      0x65,
      0x6e,
      0x74,
      0x5f,
      0x68,
      0x65,
      0x69,
      0x67,
      0x68,
      0x74,
      0x06,
      0x01,
      0x00,
      0x00,
      0x00,
      0x06,
      0x74,
      0x6f,
      0x70,
      0x5f,
      0x69,
      0x64,
      0x0a,
      0x80,
      0xab,
      0x7f,
      0x40,
      0x44,
      0xc5,
      0x41,
      0xc1,
      0xba,
      0x28,
      0xb6,
      0x50,
      0x10,
      0xad,
      0x61,
      0x91,
      0xf8,
      0xf6,
      0xc9,
      0x81,
      0x55,
      0x01,
      0x41,
      0xfc,
      0xbc,
      0xa8,
      0x14,
      0xe7,
      0xe0,
      0x26,
      0x62,
      0x70,
      0x31,
    ];
    const reader = new BufferStreamReader(Buffer.from(data));
    const json: handshake.IRequest = handshake.Reader.request(reader);
    assert(json.node.localTime.getTime() === 1560854536);
    assert(json.node.version === 1);
    assert(json.node.myPort === 19800);
    assert.deepEqual(json.node.networkId, [
      0x43,
      0x52,
      0x59,
      0x50,
      0x54,
      0x4f,
      0x4e,
      0x43,
      0xf4,
      0xe5,
      0x30,
      0xc2,
      0xb0,
      0x19,
      0x01,
      0x10,
    ]);

    assert(
      json.node.peerId ===
        Buffer.from([
          0xdf,
          0xc4,
          0x70,
          0x18,
          0xf3,
          0x09,
          0x88,
          0xb6,
        ]).readDoubleLE(0)
    );
  });

  // test('should write/read handshake request stream', async () => {
  //   const data: handshake.IRequest = {
  //     node: {
  //       networkId: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  //       version: 1,
  //       // tslint:disable-next-line:object-literal-sort-keys
  //       localTime: new Date(),
  //       myPort: 8080,
  //       peerId: 0xa9183832,
  //     },
  //     payload: {
  //       currentHeight: 1,
  //       hash: new Buffer([
  //         1,
  //         2,
  //         3,
  //         4,
  //         5,
  //         6,
  //         7,
  //         8,
  //         9,
  //         10,
  //         11,
  //         12,
  //         13,
  //         14,
  //         15,
  //         16,
  //         18,
  //         19,
  //         20,
  //         21,
  //         22,
  //         23,
  //         24,
  //         25,
  //         26,
  //         27,
  //         28,
  //         29,
  //         30,
  //         31,
  //         32,
  //       ]),
  //     },
  //   };
  //   const writer = new BufferStreamWriter(Buffer.alloc(0));
  //   handshake.Writer.request(writer, data);

  //   const reader = new BufferStreamReader(writer.getBuffer());
  //   const json: handshake.IRequest = handshake.Reader.request(reader);
  //   assert.deepEqual(json, data);
  // });
});
