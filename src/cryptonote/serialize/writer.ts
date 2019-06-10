import assert = require('assert');
import { Hash, HASH_LENGTH } from '../../crypto/types';

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

  public writeUInt8(value: number) {
    this.checkBuffer(1);
    this.buffer.writeUInt8(value, this.index);
    this.index += 1;
  }

  public writeUInt32(value: number) {
    this.checkBuffer(4);
    this.buffer.writeUInt32LE(value, this.index);
    this.index += 4;
  }

  public writeUInt64(value: number) {
    this.checkBuffer(8);
    this.buffer.writeDoubleLE(value, this.index);
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
