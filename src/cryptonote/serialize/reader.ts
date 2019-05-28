import assert = require('assert');
import { HASH_LENGTH } from '../../crypto/types';

export class BufferStreamReader {
  private buffer: Buffer;
  private index: number;

  constructor(buffer: Buffer) {
    assert(buffer);
    assert(buffer instanceof Buffer);
    this.buffer = buffer;
    this.index = 0;
  }

  public readUInt8(): number {
    return this.buffer.readUInt8(this.index++);
  }

  public readUInt32(): number {
    const v = this.buffer.readUInt32LE(this.index);
    this.index += 4;
    return v;
  }

  public readUInt64(): number {
    const v = this.buffer.readDoubleLE(this.index);
    this.index += 8;
    return v;
  }

  public readVarint() {
    let value = 0;
    let shift = 0;
    let bytes = 0;

    for (let i = this.index; i < this.buffer.length; i++) {
      const piece = this.buffer[i];
      // tslint:disable-next-line: no-bitwise
      value |= (piece & 0x7f) << shift;
      shift += 7;
      bytes++;
      // tslint:disable-next-line: no-bitwise
      if ((piece & 0x80) === 0) {
        break;
      }
    }
    this.index += bytes;

    return value;
  }

  public readHash(): Buffer {
    return this.read(HASH_LENGTH);
  }

  public read(i: number) {
    const buffer = new Buffer(i);
    this.buffer.copy(buffer, 0, this.index, this.index + i);
    this.index += i;
    return buffer;
  }
}
