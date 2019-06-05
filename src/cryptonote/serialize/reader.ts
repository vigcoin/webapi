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

  public getBuffer() {
    return this.buffer;
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

  public getShiftValue(shift: number, piece: number) {
    if (shift < 28) {
      // tslint:disable-next-line: no-bitwise
      return (piece & 0x7f) << shift;
    }
    // tslint:disable-next-line:no-bitwise
    return (piece & 0x7f) * Math.pow(2, shift);
  }

  public readVarint() {
    let value = 0;
    let shift = 0;
    let bytes = 0;
    let i = this.index;
    let piece = 0;

    do {
      piece = this.buffer[i++];
      value += this.getShiftValue(shift, piece);
      shift += 7;
      bytes++;
    } while (piece >= 0x80);

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