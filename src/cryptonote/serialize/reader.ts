import assert = require('assert');
import { HASH_LENGTH } from '../../crypto/types';
import { INT64, UINT64 } from '../types';
import { PurgeZeroByte } from './common';

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

  public getRemainedSize() {
    return this.buffer.length - this.index;
  }

  public readUInt8(): number {
    return this.buffer.readUInt8(this.index++);
  }

  public readInt8(): number {
    return this.buffer.readInt8(this.index++);
  }

  public readInt16(): number {
    const v = this.buffer.readInt16LE(this.index);
    this.index += 2;
    return v;
  }

  public readUInt16(): number {
    const v = this.buffer.readUInt16LE(this.index);
    this.index += 2;
    return v;
  }

  public readUInt32(): number {
    const v = this.buffer.readUInt32LE(this.index);
    this.index += 4;
    return v;
  }

  public readInt32(): number {
    const v = this.buffer.readInt32LE(this.index);
    this.index += 4;
    return v;
  }

  public readInt64(): INT64 {
    return this.read(8);
  }

  public readUInt64(): UINT64 {
    return this.read(8);
  }

  public readDouble(): number {
    const v = this.buffer.readDoubleLE(this.index);
    this.index += 8;
    return v;
  }

  public readDate(): Date {
    const v = this.buffer.readUInt32LE(this.index);
    this.buffer.readUInt32LE(this.index + 4);
    this.index += 8;
    return new Date(v * 1000);
  }

  public getShiftValue(shift: number, piece: number) {
    if (shift < 28) {
      // tslint:disable-next-line: no-bitwise
      return (piece & 0x7f) << shift;
    }
    // tslint:disable-next-line:no-bitwise
    return (piece & 0x7f) * Math.pow(2, shift);
  }

  public readVarintUInt64(): Buffer {
    let buffer = this.readVarintBuffer();
    const diff = 8 - buffer.length;
    if (diff < 0) {
      throw new Error('None UInt64 Data!');
    }
    if (diff > 0) {
      buffer = Buffer.concat([buffer, Buffer.alloc(diff)]);
    }
    return buffer;
  }

  public readVarintBuffer() {
    let bytes = 0;
    let i = this.index;
    let piece = 0;
    let bufferIndex = 0;
    let pad = 0;
    let mask = 0;
    let maskValue = 0;

    let buffer = Buffer.alloc(0);

    while (true) {
      piece = this.buffer[i++];
      buffer = Buffer.concat([buffer, Buffer.alloc(1)]);
      // tslint:disable-next-line:no-bitwise
      const real = (piece & 0x7f) >>> pad;
      buffer[bufferIndex] = real;
      if (pad) {
        // tslint:disable-next-line:no-bitwise
        mask = (1 << pad) - 1;
        // tslint:disable-next-line:no-bitwise
        maskValue = (piece & mask) << (8 - pad);
        // tslint:disable-next-line:no-bitwise
        buffer[bufferIndex - 1] |= maskValue;
      }
      bytes++;
      if (piece < 0x80) {
        break;
      }
      pad++;
      if (pad % 8 === 0) {
        pad = 0;
      } else {
        bufferIndex++;
      }
    }
    this.index += bytes;
    buffer = PurgeZeroByte(buffer);
    return buffer;
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
    const buffer = Buffer.alloc(i);
    this.buffer.copy(buffer, 0, this.index, this.index + i);
    this.index += i;
    return buffer;
  }
}
