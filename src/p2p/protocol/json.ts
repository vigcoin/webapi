import * as assert from 'assert';
import { ICoreSyncData, IPeerEntry, IPeerNodeData } from '../../cryptonote/p2p';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';

const PORTABLE_STORAGE_SIGNATUREA = 0x01011101;
const PORTABLE_STORAGE_SIGNATUREB = 0x01020101; // bender's nightmare

const PORTABLE_STORAGE_FORMAT_VER = 1;

const PORTABLE_RAW_SIZE_MARK_MASK = 0x03;
const PORTABLE_RAW_SIZE_MARK_BYTE = 0;
const PORTABLE_RAW_SIZE_MARK_WORD = 1;
const PORTABLE_RAW_SIZE_MARK_DWORD = 2;
const PORTABLE_RAW_SIZE_MARK_INT64 = 3;

export const BIN_KV_SERIALIZE_TYPE_INT64 = 1;
export const BIN_KV_SERIALIZE_TYPE_INT32 = 2;
export const BIN_KV_SERIALIZE_TYPE_INT16 = 3;
export const BIN_KV_SERIALIZE_TYPE_INT8 = 4;
export const BIN_KV_SERIALIZE_TYPE_UINT64 = 5;
export const BIN_KV_SERIALIZE_TYPE_UINT32 = 6;
export const BIN_KV_SERIALIZE_TYPE_UINT16 = 7;
export const BIN_KV_SERIALIZE_TYPE_UINT8 = 8;
export const BIN_KV_SERIALIZE_TYPE_DOUBLE = 9;
export const BIN_KV_SERIALIZE_TYPE_STRING = 10;
export const BIN_KV_SERIALIZE_TYPE_BOOL = 11;
export const BIN_KV_SERIALIZE_TYPE_OBJECT = 12;
export const BIN_KV_SERIALIZE_TYPE_ARRAY = 13;
export const BIN_KV_SERIALIZE_TYPE_DATE = 14; // FOR temporary usage only
export const BIN_KV_SERIALIZE_FLAG_ARRAY = 0x80;

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

export function writeKVBlockHeader(writer: BufferStreamWriter) {
  const header: IKVBlockHeader = {
    signatureA: PORTABLE_STORAGE_SIGNATUREA,
    signatureB: PORTABLE_STORAGE_SIGNATUREB,
    version: PORTABLE_STORAGE_FORMAT_VER,
  };

  writer.writeUInt32(header.signatureA);
  writer.writeUInt32(header.signatureB);
  writer.writeUInt8(header.version);
}

export function readJSONVarint(reader: BufferStreamReader) {
  const byte = reader.readUInt8();
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
    // temporary not used!
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

export function writeJSONVarint(writer: BufferStreamWriter, val: number) {
  let mask = PORTABLE_RAW_SIZE_MARK_BYTE;
  // tslint:disable-next-line:no-bitwise
  if (val > 0xff >>> 2) {
    mask = PORTABLE_RAW_SIZE_MARK_WORD;
  }
  // tslint:disable-next-line:no-bitwise
  if (val > 0xffff >>> 2) {
    mask = PORTABLE_RAW_SIZE_MARK_DWORD;
  }
  // tslint:disable-next-line:no-bitwise
  if (val > 0xffffffff >>> 2) {
    mask = PORTABLE_RAW_SIZE_MARK_INT64;
  }
  // tslint:disable-next-line:no-bitwise
  val <<= 2;
  // tslint:disable-next-line:no-bitwise
  val |= mask;
  switch (mask) {
    case PORTABLE_RAW_SIZE_MARK_BYTE:
      writer.writeUInt8(val);
      break;
    case PORTABLE_RAW_SIZE_MARK_WORD:
      writer.writeUInt16(val);
      break;
    case PORTABLE_RAW_SIZE_MARK_DWORD:
      writer.writeUInt32(val);
      break;
    // temporary not used!
    case PORTABLE_RAW_SIZE_MARK_INT64:
      writer.writeUInt64(val);
      break;
  }
}

export function readJSONName(reader: BufferStreamReader): string {
  const length = reader.readUInt8();
  assert(length >= 0);
  const name = reader.read(length);
  return name.toString('utf8');
}

export function writeJSONName(writer: BufferStreamWriter, name: string) {
  writer.writeUInt8(name.length);
  writer.write(Buffer.from(name, 'utf8'));
}

export function readJSONString(reader: BufferStreamReader) {
  const size = readJSONVarint(reader);
  return reader.read(size);
}

export function writeJSONString(writer: BufferStreamWriter, data: string) {
  writeJSONVarint(writer, data.length);
  writer.write(Buffer.from(data, 'utf8'));
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
      return reader.readDouble();
    case BIN_KV_SERIALIZE_TYPE_BOOL:
      return reader.readUInt8() !== 0;
    case BIN_KV_SERIALIZE_TYPE_STRING:
      return readJSONString(reader);
    case BIN_KV_SERIALIZE_TYPE_OBJECT:
      return readJSONObject(reader);
    default:
      throw new Error('Unknown data type!');
  }
}

export function writeJSONValue(
  writer: BufferStreamWriter,
  data: any,
  type: number
) {
  switch (type) {
    case BIN_KV_SERIALIZE_TYPE_INT64:
      return writer.writeDouble(data);
    case BIN_KV_SERIALIZE_TYPE_INT32:
      return writer.writeInt32(data);
    case BIN_KV_SERIALIZE_TYPE_INT16:
      return writer.writeInt16(data);
    case BIN_KV_SERIALIZE_TYPE_INT8:
      return writer.writeInt8(data);
    case BIN_KV_SERIALIZE_TYPE_UINT64:
      return writer.writeDouble(data);
    case BIN_KV_SERIALIZE_TYPE_UINT32:
      return writer.writeUInt32(data);
    case BIN_KV_SERIALIZE_TYPE_UINT16:
      return writer.writeInt16(data);
    case BIN_KV_SERIALIZE_TYPE_UINT8:
      return writer.writeUInt8(data);
    case BIN_KV_SERIALIZE_TYPE_DOUBLE:
      return writer.writeDouble(data);
    case BIN_KV_SERIALIZE_TYPE_DATE:
      writer.writeUInt32(data);
      return writer.writeUInt32(0);
    case BIN_KV_SERIALIZE_TYPE_BOOL:
      return writer.writeUInt8(data !== 0 ? 1 : 0);
    case BIN_KV_SERIALIZE_TYPE_STRING:
      return writeJSONString(writer, data);
    case BIN_KV_SERIALIZE_TYPE_OBJECT:
      return;
      break;
    case BIN_KV_SERIALIZE_TYPE_ARRAY:
      writeJSONVarint(writer, data.length);
      if (!(data instanceof Buffer)) {
        data = Buffer.from(data);
      }
      return writer.write(data);
    default:
      throw new Error('Unknown data type!');
  }
}

export function readJSONArray(reader: BufferStreamReader, type: number): any[] {
  const arr = [];
  const size = readJSONVarint(reader);
  for (let i = 0; i < size; i++) {
    arr.push(readJSONValue(reader, type));
  }
  return arr;
}

export function writeJSONArray(
  writer: BufferStreamWriter,
  items: [],
  type: number
) {
  writeJSONVarint(writer, items.length);
  for (const item of items) {
    writeJSONValue(writer, item, type);
  }
}

export function readJSONObjectValue(reader: BufferStreamReader) {
  let type = reader.readUInt8();
  // tslint:disable-next-line:no-bitwise
  if (type & BIN_KV_SERIALIZE_FLAG_ARRAY) {
    // tslint:disable-next-line:no-bitwise
    type &= ~BIN_KV_SERIALIZE_FLAG_ARRAY;
    return readJSONArray(reader, type);
  }
  const obj = readJSONValue(reader, type);
  return obj;
}

export function writeJSONObjectValue(
  writer: BufferStreamWriter,
  data: any,
  type: number
) {
  if (type !== BIN_KV_SERIALIZE_TYPE_ARRAY) {
    writer.writeUInt8(type);
  }
  // tslint:disable-next-line:no-bitwise
  if (type & BIN_KV_SERIALIZE_FLAG_ARRAY) {
    // tslint:disable-next-line:no-bitwise
    type &= ~BIN_KV_SERIALIZE_FLAG_ARRAY;
    return writeJSONArray(writer, data, type);
  }
  writeJSONValue(writer, data, type);
}

export function readJSONObject(reader: BufferStreamReader) {
  const count = readJSONVarint(reader);
  const obj: any = {};
  for (let i = 0; i < count; i++) {
    const name = readJSONName(reader);
    obj[name] = readJSONObjectValue(reader);
  }
  return obj;
}

export function writeJSONObjectKeyCount(
  writer: BufferStreamWriter,
  name: string,
  count: number
) {
  writeJSONName(writer, name);
  writeJSONVarint(writer, BIN_KV_SERIALIZE_TYPE_OBJECT);
  writeJSONVarint(writer, count);
}

export function writeJSONObjectKeyValue(
  writer: BufferStreamWriter,
  name: string,
  value: any,
  type: number
) {
  writeJSONName(writer, name);
  writeJSONObjectValue(writer, value, type);
}

export function readJSON(reader: BufferStreamReader): any {
  const header = readKVBlockHeader(reader);
  assert(header.signatureA === PORTABLE_STORAGE_SIGNATUREA);
  assert(header.signatureB === PORTABLE_STORAGE_SIGNATUREB);
  assert(header.version === PORTABLE_STORAGE_FORMAT_VER);
  return readJSONObject(reader);
}

export function writeJSONDateType(
  writer: BufferStreamWriter,
  name: string,
  data: number
) {
  writeJSONName(writer, name);
  writer.writeUInt8(BIN_KV_SERIALIZE_TYPE_UINT64);
  writer.writeUInt32(data & 0xffffffff);
  writer.writeUInt32(0);
}
export function writeJSONIPeerNodeData(
  writer: BufferStreamWriter,
  name: string,
  data: IPeerNodeData
) {
  writeJSONObjectKeyValue(writer, name, data, BIN_KV_SERIALIZE_TYPE_OBJECT);
  writeJSONVarint(writer, Object.keys(data).length);
  writeJSONObjectKeyValue(
    writer,
    'network_id',
    data.networkId,
    // tslint:disable-next-line:no-bitwise
    BIN_KV_SERIALIZE_TYPE_STRING
  );

  writeJSONObjectKeyValue(
    writer,
    'version',
    data.version,
    BIN_KV_SERIALIZE_TYPE_UINT8
  );

  writeJSONObjectKeyValue(
    writer,
    'peer_id',
    data.peerId,
    BIN_KV_SERIALIZE_TYPE_UINT64
  );
  writeJSONDateType(writer, 'local_time', data.localTime.getTime());

  writeJSONObjectKeyValue(
    writer,
    'my_port',
    data.myPort,
    BIN_KV_SERIALIZE_TYPE_UINT32
  );
}

export function writeJSONICoreSyncData(
  writer: BufferStreamWriter,
  name: string,
  data: ICoreSyncData
) {
  writeJSONObjectKeyValue(writer, name, data, BIN_KV_SERIALIZE_TYPE_OBJECT);
  writeJSONVarint(writer, Object.keys(data).length);
  writeJSONObjectKeyValue(
    writer,
    'current_height',
    data.currentHeight,
    BIN_KV_SERIALIZE_TYPE_UINT32
  );
  writeJSONObjectKeyValue(
    writer,
    'top_id',
    data.hash,
    // tslint:disable-next-line:no-bitwise
    BIN_KV_SERIALIZE_TYPE_STRING
  );
}

export function writeJSONIPeerEntry(
  writer: BufferStreamWriter,
  data: IPeerEntry
) {
  writer.writeUInt32(data.peer.port);
  writer.writeUInt32(data.peer.ip);
  writer.writeUInt64(data.id);
  writer.writeDate(data.lastSeen);
}

export function writeJSONIPeerEntryList(
  writer: BufferStreamWriter,
  name: string,
  data: IPeerEntry[]
) {
  writeJSONName(writer, name);
  const inner = new BufferStreamWriter(Buffer.alloc(0));
  for (const entry of data) {
    writeJSONIPeerEntry(inner, entry);
  }
  writeJSONVarint(writer, inner.getBuffer().length);
  writer.write(inner.getBuffer());
}

export function readJSONIPeerEntry(reader: BufferStreamReader): IPeerEntry {
  const port = reader.readUInt32();
  const ip = reader.readUInt32();
  const id = reader.readUInt64();
  const lastSeen = reader.readDate();
  const entry: IPeerEntry = {
    peer: {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip,
    },
    // tslint:disable-next-line:object-literal-sort-keys
    id,
    lastSeen,
  };
  return entry;
}

export function readJSONIPeerEntryList(
  reader: BufferStreamReader
): IPeerEntry[] {
  const length = reader.readVarint() / 24;
  const list: IPeerEntry[] = [];
  for (let i = 0; i < length; i++) {
    list.push(readJSONIPeerEntry(reader));
  }
  return list;
}
