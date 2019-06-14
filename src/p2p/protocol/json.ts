import * as assert from 'assert';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';

const PORTABLE_STORAGE_SIGNATUREA = 0x01011101;
const PORTABLE_STORAGE_SIGNATUREB = 0x01020101; // bender's nightmare

const PORTABLE_STORAGE_FORMAT_VER = 1;

const PORTABLE_RAW_SIZE_MARK_MASK = 0x03;
const PORTABLE_RAW_SIZE_MARK_BYTE = 0;
const PORTABLE_RAW_SIZE_MARK_WORD = 1;
const PORTABLE_RAW_SIZE_MARK_DWORD = 2;
const PORTABLE_RAW_SIZE_MARK_INT64 = 3;

const BIN_KV_SERIALIZE_TYPE_INT64 = 1;
const BIN_KV_SERIALIZE_TYPE_INT32 = 2;
const BIN_KV_SERIALIZE_TYPE_INT16 = 3;
const BIN_KV_SERIALIZE_TYPE_INT8 = 4;
const BIN_KV_SERIALIZE_TYPE_UINT64 = 5;
const BIN_KV_SERIALIZE_TYPE_UINT32 = 6;
const BIN_KV_SERIALIZE_TYPE_UINT16 = 7;
const BIN_KV_SERIALIZE_TYPE_UINT8 = 8;
const BIN_KV_SERIALIZE_TYPE_DOUBLE = 9;
const BIN_KV_SERIALIZE_TYPE_STRING = 10;
const BIN_KV_SERIALIZE_TYPE_BOOL = 11;
const BIN_KV_SERIALIZE_TYPE_OBJECT = 12;
const BIN_KV_SERIALIZE_TYPE_ARRAY = 13;
const BIN_KV_SERIALIZE_FLAG_ARRAY = 0x80;

export interface IKVBlockHeader {
  signatureA: number; // uint32
  signatureB: number; // uint32
  version: number; // uint8;
}

export function readKVBlockHeader(reader: BufferStreamReader): IKVBlockHeader {
  const signatureA = reader.readUInt32();
  const signatureB = reader.readUInt32();
  const version = reader.readUInt8();
  return {
    signatureA,
    signatureB,
    version,
  };
}

export function readJSONVarint(reader: BufferStreamReader) {
  const byte = reader.readInt8();
  // tslint:disable-next-line:no-bitwise
  const mask = byte & PORTABLE_RAW_SIZE_MARK_MASK;
  let bytesLeft = 0;
  switch (mask) {
    case PORTABLE_RAW_SIZE_MARK_BYTE:
      bytesLeft = 0;
      break;
    case PORTABLE_RAW_SIZE_MARK_WORD:
      bytesLeft = 1;
      break;
    case PORTABLE_RAW_SIZE_MARK_DWORD:
      bytesLeft = 3;
      break;
    case PORTABLE_RAW_SIZE_MARK_INT64:
      bytesLeft = 7;
      break;
  }

  let value = byte;
  for (let i = 1; i <= bytesLeft; i++) {
    const temp = reader.readUInt8();
    // tslint:disable-next-line:no-bitwise
    value |= temp << (i * 8);
  }
  // tslint:disable-next-line:no-bitwise
  value >>>= 2;
  return value;
}

export function readJSONName(reader: BufferStreamReader): string {
  const length = reader.readInt8();
  assert(length >= 0);
  const name = reader.read(length);
  return name.toString('utf8');
}

export function readJSONString(reader: BufferStreamReader) {
  const size = readJSONVarint(reader);
  return String(reader.read(size));
}

export function readJSONValue(reader: BufferStreamReader, type: number) {
  switch (type) {
    case BIN_KV_SERIALIZE_TYPE_INT64:
      return reader.read(8);
    case BIN_KV_SERIALIZE_TYPE_INT32:
      return reader.readInt32();
    case BIN_KV_SERIALIZE_TYPE_INT16:
      return reader.readInt16();
    case BIN_KV_SERIALIZE_TYPE_INT8:
      return reader.readInt8();
    case BIN_KV_SERIALIZE_TYPE_UINT64:
      return reader.read(8);
    case BIN_KV_SERIALIZE_TYPE_UINT32:
      return reader.readUInt32();
    case BIN_KV_SERIALIZE_TYPE_UINT16:
      return reader.readUInt16();
    case BIN_KV_SERIALIZE_TYPE_UINT8:
      return reader.readUInt8();
    case BIN_KV_SERIALIZE_TYPE_DOUBLE:
      return reader.readUInt8();
    case BIN_KV_SERIALIZE_TYPE_BOOL:
      return reader.readUInt8() !== 0;
    case BIN_KV_SERIALIZE_TYPE_STRING:
      return readJSONString(reader);
    case BIN_KV_SERIALIZE_TYPE_OBJECT:
      return readJSONObject(reader);
    case BIN_KV_SERIALIZE_TYPE_ARRAY:
      return readJSONArray(reader, type);
    default:
      throw new Error('Unknown data type!');
      break;
  }
}
export function readJSONArray(reader: BufferStreamReader, type: number) {
  const arr = [];
  const size = readJSONVarint(reader);
  for (let i = 0; i < size; i++) {
    arr.push(readJSONValue(reader, type));
  }
}
export function readJSONObject(reader: BufferStreamReader) {
  let type = reader.readUInt8();
  // tslint:disable-next-line:no-bitwise
  if (type & BIN_KV_SERIALIZE_FLAG_ARRAY) {
    // tslint:disable-next-line:no-bitwise
    type &= ~BIN_KV_SERIALIZE_FLAG_ARRAY;
    return readJSONArray(reader, type);
  }
  return readJSONValue(reader, type);
}

export function readJSON(reader: BufferStreamReader): JSON {
  const header = readKVBlockHeader(reader);
  assert(header.signatureA === PORTABLE_STORAGE_SIGNATUREA);
  assert(header.signatureB === PORTABLE_STORAGE_SIGNATUREB);
  assert(header.version === PORTABLE_STORAGE_FORMAT_VER);
  const count = readJSONVarint(reader);
  const obj: any = {};
  for (let i = 0; i < count; i++) {
    const name = readJSONName(reader);
    obj[name] = readJSONObject(reader);
  }
  return obj;
}