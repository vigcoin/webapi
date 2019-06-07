import {
  close,
  closeSync,
  existsSync,
  openSync,
  readSync,
  writeSync,
} from 'fs';
import { BufferStreamWriter } from '../serialize/writer';

export class BlockIndex {
  private filename: string;
  private offsets: number[];
  private fd: number;
  private height: number;

  constructor(filename: string) {
    this.filename = filename;
    this.offsets = [];
    this.fd = null;
    this.height = 0;
  }

  public init() {
    if (!existsSync(this.filename)) {
      this.fd = openSync(this.filename, 'w');
    } else {
      this.fd = openSync(this.filename, 'r+');
      this.height = this.readHeight();
      this.readItems();
    }
  }

  public deinit() {
    closeSync(this.fd);
    this.height = 0;
    this.offsets = [];
    this.fd = null;
  }

  public writeHeight(height: number) {
    const buffer = new Buffer(4);
    buffer.writeInt32LE(height, 0);
    writeSync(this.fd, buffer);
    buffer.writeInt32LE(0, 0);
    writeSync(this.fd, buffer);
  }

  public writeItem(offset: number) {
    const buffer = new Buffer(4);
    buffer.writeInt32LE(offset, 0);
    writeSync(this.fd, buffer);
  }

  public readHeight(): number {
    const buffer = new Buffer(8);
    readSync(this.fd, buffer, 0, buffer.length, null);
    const low = buffer.readUInt32LE(0);
    // const height = buffer.readInt32LE(4);
    return low; // should be readUint64
  }

  public readItems() {
    for (let i = 0; i < this.height; i++) {
      const buffer = new Buffer(4);
      readSync(this.fd, buffer, 0, buffer.length, null);
      const offset = buffer.readInt32LE(0);
      this.offsets[i] = offset;
    }
  }

  public getOffsets() {
    return this.offsets;
  }

  public empty(): boolean {
    return this.offsets.length === 0;
  }
}
