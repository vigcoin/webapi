import assert = require('assert');
import { HASH_LENGTH } from '../crypto/types';


export class BufferStreamReader {
  private buffer:Buffer;
  private index: number;
  constructor(buffer:Buffer) {
    assert(buffer);
    assert(buffer instanceof Buffer);
    this.buffer = buffer;
    this.index = 0;
  }
  public readUInt8(): number {
    return this.buffer.readUInt8(this.index++);
  }
  public readUInt32() : number{
    const v = this.buffer.readUInt32LE(this.index);
    this.index += 4;
    return v;
  }
  public readUInt64(): number {
    const v = this.buffer.readBigUInt64LE(this.index);
    this.index += 8;
    return v;
  }
  public readHash(): Buffer {
    const hash = new Buffer(HASH_LENGTH);
    this.buffer.copy(hash, 0, this.index, this.index + HASH_LENGTH);
    this.index += HASH_LENGTH;
    return hash;
  }
}
