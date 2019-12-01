import * as assert from 'assert';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import { handshake } from '../../src/p2p/protocol/commands/handshake';
import { ping } from '../../src/p2p/protocol/commands/ping';
import { timedsync } from '../../src/p2p/protocol/commands/timedsync';
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
  writeJSONValue,
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
    const newPeerId = Buffer.from([
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

  test('should read ping request stream', async () => {
    const data = [0x01, 0x11, 0x01, 0x01, 0x01, 0x01, 0x02, 0x01, 0x01, 0x00];
    const reader = new BufferStreamReader(Buffer.from(data));
    const json = ping.Reader.request(reader);
    assert(Object.keys(json).length === 0);
  });

  test('should read ping response stream', async () => {
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
      0xdf,
      0xc4,
      0x70,
      0x18,
      0xf3,
      0x09,
      0x88,
      0xb6,
    ];
    const reader = new BufferStreamReader(Buffer.from(data));
    const json = ping.Reader.response(reader);
    assert(String(json.status) === 'OK');
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
    const buffer = Buffer.from([
      0x18,
      0x38,
      0x38,
      0x32,
      0x92,
      0x09,
      0xdd,
      0xfe,
    ]);
    const data: ping.IResponse = {
      status: 'OK',
      // tslint:disable-next-line:object-literal-sort-keys
      peerId: buffer,
    };
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    ping.Writer.response(writer, data);

    const reader = new BufferStreamReader(writer.getBuffer());
    const json = ping.Reader.response(reader);
    assert(String(json.status) === 'OK');
    assert(json.peerId.equals(buffer));
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
    assert(Math.floor(json.node.localTime.getTime() / 1000) === 1560854536);
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
      json.node.peerId.equals(
        Buffer.from([0xdf, 0xc4, 0x70, 0x18, 0xf3, 0x09, 0x88, 0xb6])
      )
    );
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    handshake.Writer.request(writer, json);
    const buffer = writer.getBuffer();
    assert(buffer.equals(Buffer.from(data)));
  });

  test('should write/read handshake request stream', async () => {
    const data: handshake.IRequest = {
      node: {
        networkId: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(),
        myPort: 8080,
        peerId: Buffer.from([0xa9, 0x18, 0x38, 0x32, 0, 0, 0, 0]),
      },
      payload: {
        currentHeight: 1,
        hash: Buffer.from([
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          18,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31,
          32,
        ]),
      },
    };
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    handshake.Writer.request(writer, data);

    const reader = new BufferStreamReader(writer.getBuffer());
    const json: handshake.IRequest = handshake.Reader.request(reader);
    assert(json.node.version === data.node.version);
    assert(json.node.myPort === data.node.myPort);
    assert(json.node.peerId.equals(data.node.peerId));
    assert.deepEqual(json.node.networkId, data.node.networkId);
    assert(
      Math.floor(json.node.localTime.getTime() / 1000) ===
        Math.floor(data.node.localTime.getTime() / 1000)
    );
  });

  test('should read handshake response stream', async () => {
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
      0x0c,
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
      0x55,
      0x30,
      0x15,
      0x69,
      0x7e,
      0x82,
      0x2c,
      0xb4,
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
      0xdd,
      0xe0,
      0x09,
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
      0x19,
      0x97,
      0x04,
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
      0xef,
      0xa3,
      0x07,
      0x37,
      0x6b,
      0xc4,
      0x61,
      0x1a,
      0x07,
      0xb3,
      0xe9,
      0x46,
      0xe4,
      0xcf,
      0x53,
      0xcc,
      0x60,
      0x1a,
      0x1c,
      0x96,
      0x5e,
      0x18,
      0x5a,
      0xe4,
      0x66,
      0x30,
      0x19,
      0x06,
      0x8e,
      0xe8,
      0xa8,
      0x97,
      0x0e,
      0x6c,
      0x6f,
      0x63,
      0x61,
      0x6c,
      0x5f,
      0x70,
      0x65,
      0x65,
      0x72,
      0x6c,
      0x69,
      0x73,
      0x74,
      0x0a,
      0x01,
      0x09,
      0x7c,
      0x9c,
      0x78,
      0xcf,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xe2,
      0x34,
      0x8b,
      0x76,
      0x12,
      0x73,
      0xf0,
      0x93,
      0xbb,
      0xe0,
      0x09,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x13,
      0x59,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0xba,
      0xe0,
      0x09,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0xab,
      0x0f,
      0x9f,
      0x0e,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0x8e,
      0x84,
      0x05,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x99,
      0x46,
      0x7d,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x7a,
      0xd4,
      0xb2,
      0x47,
      0x34,
      0x31,
      0xf6,
      0x3c,
      0x80,
      0x07,
      0x03,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0xb6,
      0x3d,
      0x85,
      0x30,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xbc,
      0xab,
      0x85,
      0x2d,
      0xff,
      0x41,
      0xcb,
      0x9f,
      0x27,
      0x02,
      0x02,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x9d,
      0xa6,
      0x56,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x7a,
      0xd4,
      0xb2,
      0x47,
      0x34,
      0x31,
      0xf6,
      0x3c,
      0x6a,
      0xed,
      0x01,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0xab,
      0x0f,
      0x9e,
      0x68,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0xe1,
      0x8f,
      0x01,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7c,
      0x9c,
      0x64,
      0x81,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x9d,
      0x5c,
      0x28,
      0xe5,
      0xe0,
      0xd0,
      0x34,
      0x12,
      0xae,
      0xf7,
      0xfe,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x65,
      0xe8,
      0xdd,
      0xf4,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xeb,
      0x6d,
      0x9d,
      0xb8,
      0xa1,
      0x82,
      0xa8,
      0xe2,
      0x88,
      0x22,
      0xfe,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0xa1,
      0xca,
      0xcb,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0x7e,
      0x9b,
      0xfd,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x9a,
      0xd1,
      0x05,
      0x83,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x63,
      0x74,
      0x06,
      0xd3,
      0xf8,
      0xc6,
      0xf0,
      0x06,
      0xa2,
      0x60,
      0xfc,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0xab,
      0x0f,
      0x9c,
      0x97,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0xda,
      0xa6,
      0xf9,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x99,
      0x47,
      0x6c,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x4d,
      0xcb,
      0xc1,
      0x93,
      0x32,
      0x4e,
      0x5f,
      0x15,
      0xa5,
      0xd9,
      0xf8,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0xab,
      0x0f,
      0x9c,
      0xa7,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0x3d,
      0xb2,
      0xf5,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x99,
      0x46,
      0x20,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x35,
      0x42,
      0xad,
      0xd4,
      0xef,
      0x56,
      0x32,
      0x04,
      0x5a,
      0xf5,
      0xf4,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x13,
      0x1b,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0x8b,
      0xc6,
      0xf4,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x65,
      0xe9,
      0xdb,
      0xff,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xeb,
      0x6d,
      0x9d,
      0xb8,
      0xa1,
      0x82,
      0xa8,
      0xe2,
      0x5b,
      0x89,
      0xf2,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x45,
      0xab,
      0x49,
      0xfc,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x81,
      0x40,
      0x26,
      0xec,
      0x0f,
      0x0f,
      0x29,
      0xf7,
      0xa4,
      0x1b,
      0xf2,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x90,
      0xca,
      0x0a,
      0xb7,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x55,
      0x92,
      0xc6,
      0x1e,
      0xbe,
      0x86,
      0x33,
      0x38,
      0xd5,
      0x17,
      0xf2,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x77,
      0x88,
      0x72,
      0xe4,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xeb,
      0x6d,
      0x9d,
      0xb8,
      0xa1,
      0x82,
      0xa8,
      0xe2,
      0x6f,
      0xf9,
      0xf0,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x11,
      0x6a,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0x7a,
      0xfa,
      0xec,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x11,
      0xd0,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0xc3,
      0x65,
      0xec,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x13,
      0x64,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0xde,
      0xd1,
      0xe7,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x13,
      0x38,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0xf7,
      0x10,
      0xe5,
      0x5c,
      0x00,
      0x00,
      0x00,
      0x00,
    ];

    const reader = new BufferStreamReader(Buffer.from(data));
    const json: handshake.IResponse = handshake.Reader.response(reader);
    assert(json.node.version === 1);
    assert(json.node.myPort === 19800);
    assert(json.payload.currentHeight === 300825);
    assert(json.localPeerList.length === 24);

    const writer = new BufferStreamWriter(Buffer.alloc(0));
    handshake.Writer.response(writer, json);
    assert(writer.getBuffer().equals(Buffer.from(data)));
  });

  test('should read/write timedsync request stream', async () => {
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
      0x04,
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
      0xaf,
      0x97,
      0x04,
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
      0xdb,
      0xb0,
      0x3c,
      0xb1,
      0xb4,
      0x48,
      0x3e,
      0x28,
      0x54,
      0xd1,
      0x3e,
      0x85,
      0x4e,
      0x85,
      0x46,
      0x54,
      0x3b,
      0xfb,
      0x15,
      0x70,
      0x27,
      0xd3,
      0x7f,
      0x8b,
      0xb5,
      0x3e,
      0xa3,
      0xa7,
      0x8e,
      0x8a,
      0xdc,
      0x11,
    ];
    const reader = new BufferStreamReader(Buffer.from(data));
    const json = timedsync.Reader.request(reader);
    assert(Object.keys(json).length === 1);
    assert(json.payload.currentHeight === 300975);
    assert(
      json.payload.hash.equals(
        Buffer.from([
          0xdb,
          0xb0,
          0x3c,
          0xb1,
          0xb4,
          0x48,
          0x3e,
          0x28,
          0x54,
          0xd1,
          0x3e,
          0x85,
          0x4e,
          0x85,
          0x46,
          0x54,
          0x3b,
          0xfb,
          0x15,
          0x70,
          0x27,
          0xd3,
          0x7f,
          0x8b,
          0xb5,
          0x3e,
          0xa3,
          0xa7,
          0x8e,
          0x8a,
          0xdc,
          0x11,
        ])
      )
    );

    const writer = new BufferStreamWriter(Buffer.alloc(0));
    timedsync.Writer.request(writer, json);
    assert(writer.getBuffer().equals(Buffer.from(data)));
  });

  test('should read/write timedsync response stream', async () => {
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
      0x0c,
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
      0xda,
      0x17,
      0x0b,
      0x5d,
      0x00,
      0x00,
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
      0x0e,
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
      0x4d,
      0xbf,
      0xeb,
      0x3a,
      0xc4,
      0x04,
      0x88,
      0x1e,
      0xa7,
      0x6a,
      0x5d,
      0x62,
      0x7d,
      0xc6,
      0x7a,
      0x0b,
      0xf6,
      0x97,
      0x39,
      0x9f,
      0xf2,
      0x36,
      0xec,
      0x8f,
      0x2c,
      0xf5,
      0x6e,
      0xc8,
      0xcd,
      0x81,
      0xeb,
      0x5f,
      0x0e,
      0x6c,
      0x6f,
      0x63,
      0x61,
      0x6c,
      0x5f,
      0x70,
      0x65,
      0x65,
      0x72,
      0x6c,
      0x69,
      0x73,
      0x74,
      0x0a,
      0x21,
      0x01,
      0x27,
      0x6c,
      0xa0,
      0xfc,
      0x58,
      0x4d,
      0x00,
      0x00,
      0x55,
      0x30,
      0x15,
      0x69,
      0x7e,
      0x82,
      0x2c,
      0xb4,
      0x0f,
      0x25,
      0x0a,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0x7b,
      0x34,
      0x13,
      0x59,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xd0,
      0x94,
      0xed,
      0x5d,
      0x99,
      0xf2,
      0x6f,
      0xd8,
      0x08,
      0x25,
      0x0a,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
      0xb6,
      0x3d,
      0x85,
      0x30,
      0x58,
      0x4d,
      0x00,
      0x00,
      0xbc,
      0xab,
      0x85,
      0x2d,
      0xff,
      0x41,
      0xcb,
      0x9f,
      0x08,
      0x25,
      0x0a,
      0x5d,
      0x00,
      0x00,
      0x00,
      0x00,
    ];
    const reader = new BufferStreamReader(Buffer.from(data));
    const json = timedsync.Reader.response(reader);
    assert(Math.floor(json.localTime.getTime() / 1000) === 1561008090);
    assert(json.payload.currentHeight === 14);
    assert(json.localPeerList.length === 3);

    const writer = new BufferStreamWriter(Buffer.alloc(0));
    timedsync.Writer.response(writer, json);
    assert(writer.getBuffer().equals(Buffer.from(data)));
  });

  test('should throw if no type found', () => {
    let thrown = false;
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    try {
      writeJSONValue(writer, 0, 10000);
    } catch (e) {
      thrown = true;
    }
    assert(thrown);
  });

  test('should write bool', () => {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    writeJSONValue(writer, 0, BIN_KV_SERIALIZE_TYPE_BOOL);
    writeJSONValue(writer, 1, BIN_KV_SERIALIZE_TYPE_BOOL);
    writeJSONValue(writer, 10, BIN_KV_SERIALIZE_TYPE_DOUBLE);
    writeJSONValue(writer, 5, BIN_KV_SERIALIZE_TYPE_UINT16);
    writeJSONValue(writer, 5, BIN_KV_SERIALIZE_TYPE_INT8);
    writeJSONValue(writer, 0, BIN_KV_SERIALIZE_TYPE_INT8);
    writeJSONValue(writer, 5, BIN_KV_SERIALIZE_TYPE_INT16);
    writeJSONValue(writer, 0, BIN_KV_SERIALIZE_TYPE_INT16);
    writeJSONValue(writer, 5, BIN_KV_SERIALIZE_TYPE_INT32);
    writeJSONValue(writer, 0, BIN_KV_SERIALIZE_TYPE_INT32);
    writeJSONValue(
      writer,
      Buffer.from([5, 0, 0, 0, 0, 0, 0, 0]),
      BIN_KV_SERIALIZE_TYPE_INT64
    );
    writeJSONValue(
      writer,
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      BIN_KV_SERIALIZE_TYPE_INT64
    );

    const reader = new BufferStreamReader(writer.getBuffer());
    let value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_BOOL);
    assert(!value);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_BOOL);
    assert(value);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_DOUBLE);
    assert(value === 10);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_UINT16);
    assert(value === 5);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT8);
    assert(value === 5);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT8);
    assert(value === 0);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT16);
    assert(value === 5);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT16);
    assert(value === 0);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT32);
    assert(value === 5);
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT32);
    assert(value === 0);
    // Never used!
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT64);
    value.equals(Buffer.from([5, 0, 0, 0, 0, 0, 0, 0]));
    value = readJSONValue(reader, BIN_KV_SERIALIZE_TYPE_INT64);
    value.equals(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]));
  });
});
