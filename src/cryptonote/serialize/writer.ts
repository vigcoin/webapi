import assert = require('assert');
import { Hash, HASH_LENGTH } from '../../crypto/types';
import { INT64, UINT64 } from '../types';

export class BufferStreamWriter {
  private buffer: Buffer;
  private index: number;

  constructor(buffer: Buffer) {
    assert(buffer);
    assert(buffer instanceof Buffer);
    this.buffer = buffer;
    this.index = 0;
  }

  public checkBuffer(size: number) {
    const diff = this.buffer.length - this.index - size;
    if (diff < 0) {
      const buffer = Buffer.alloc(Math.abs(diff));
      this.buffer = Buffer.concat([this.buffer, buffer]);
    }
  }

  public getBuffer(): Buffer {
    return this.buffer;
  }

  public writeInt8(value: number) {
    this.checkBuffer(1);
    this.buffer.writeInt8(value, this.index);
    this.index += 1;
  }

  public writeUInt8(value: number) {
    this.checkBuffer(1);
    this.buffer.writeUInt8(value, this.index);
    this.index += 1;
  }

  public writeInt16(value: number) {
    this.checkBuffer(2);
    this.buffer.writeInt16LE(value, this.index);
    this.index += 2;
  }

  public writeUInt16(value: number) {
    this.checkBuffer(2);
    this.buffer.writeUInt16LE(value, this.index);
    this.index += 2;
  }

  public writeInt32(value: number) {
    this.checkBuffer(4);
    this.buffer.writeInt32LE(value, this.index);
    this.index += 4;
  }

  public writeUInt32(value: number) {
    this.checkBuffer(4);
    // tslint:disable-next-line:no-bitwise
    value &= 0xffffffff;
    // tslint:disable-next-line:no-bitwise
    value >>>= 0;
    // tslint:disable-next-line:no-bitwise
    this.buffer.writeUInt32LE(value, this.index);
    this.index += 4;
  }

  public writeInt64(value: INT64) {
    this.write(value);
  }

  public writeUInt64(value: UINT64) {
    this.write(value);
  }

  public writeDouble(value: number) {
    this.checkBuffer(8);
    this.buffer.writeDoubleLE(value, this.index);
    this.index += 8;
  }

  public writeDate(value: Date) {
    this.checkBuffer(8);
    this.buffer.writeDoubleLE(value.getTime(), this.index);
    this.index += 8;
  }

  public writeVarint(value: number) {
    while (value >= 0x80) {
      this.checkBuffer(1);
      // tslint:disable-next-line: no-bitwise
      this.buffer.writeUInt8((value | 0x80) & 0xff, this.index++);
      // tslint:disable-next-line: no-bitwise
      value >>>= 7;
    }
    this.checkBuffer(1);
    // tslint:disable-next-line: no-bitwise
    this.buffer.writeUInt8(value & 0xff, this.index++);
  }

  public writeHash(hash: Hash) {
    assert(hash.length === HASH_LENGTH);
    this.write(hash);
  }

  public write(buffer: Buffer) {
    this.checkBuffer(buffer.length);
    buffer.copy(this.buffer, this.index, 0, buffer.length);
    this.index += buffer.length;
  }
}
