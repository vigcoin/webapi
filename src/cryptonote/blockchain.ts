import { Configuration } from '../config/types';
import { existsSync, openSync, closeSync, writeSync, readSync } from 'fs';

export class BlockIndex {
  filename: string;
  offsets: number[];
  size: number = 0;
  constructor(filename: string) {
    this.filename = filename;
  }

  init() {
    if (!existsSync(this.filename)) {
      const fd = openSync(this.filename, 'w');

      // uint64 height 8 * 8 = 64
      const buffer = new Buffer(8);
      this.writeHeight(fd, buffer);
      closeSync(fd);
    } else {
      const fd = openSync(this.filename, 'r');
      const height = this.readHeight(fd);
      this.readItems(fd, height);
    }
  }

  writeHeight(fd: number, buffer: Buffer) {
    writeSync(fd, buffer);
  }

  readHeight(fd: number): number {
    const buffer = new Buffer(8);
    readSync(fd, buffer, 0, buffer.length, null);
    return buffer.readDoubleLE(0); // should be readUint64
  }

  readItems(fd: number, size: number) {
    for (let i = 0; i < size; i++) {
      const buffer = new Buffer(4);
      readSync(fd, buffer, 0, buffer.length, null);
      const offset = buffer.readInt32LE(0);
      this.offsets[i] = offset;
    }
  }
}

export class BlockChain {
  files: Configuration.IBlockFile;
  constructor(files: Configuration.IBlockFile) {
    this.files = files;
  }
}
