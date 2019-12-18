import { IHash } from '@vigcoin/crypto';
import * as assert from 'assert';
import { closeSync, existsSync, openSync, readSync, writeSync } from 'fs';
import { uint64 } from '../types';

export class BlockIndex {
  private filename: string;
  private offsets: number[];
  private fd: number;
  // tslint:disable-next-line:variable-name
  private _height: number;

  private blockHashes: IHash[] = [];

  constructor(filename: string) {
    this.filename = filename;
    this.offsets = [];
    this.fd = null;
    this._height = 0;
  }

  public init() {
    if (!existsSync(this.filename)) {
      this.fd = openSync(this.filename, 'w');
    } else {
      this.fd = openSync(this.filename, 'r+');
      this._height = this.readHeight();
      this.readItems();
    }
  }

  public deinit() {
    closeSync(this.fd);
    this._height = 0;
    this.offsets = [];
    this.fd = null;
  }

  public writeHeight(height: number) {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(height, 0);
    writeSync(this.fd, buffer);
    buffer.writeInt32LE(0, 0);
    writeSync(this.fd, buffer);
  }

  public writeItem(offset: number) {
    const buffer = Buffer.alloc(4);
    buffer.writeInt32LE(offset, 0);
    writeSync(this.fd, buffer);
  }

  public readHeight(): number {
    const buffer = Buffer.alloc(8);
    readSync(this.fd, buffer, 0, buffer.length, null);
    const low = buffer.readUInt32LE(0);
    // const height = buffer.readInt32LE(4);
    return low; // should be readUint64
  }

  public readItems() {
    for (let i = 0; i < this.height; i++) {
      const buffer = Buffer.alloc(4);
      readSync(this.fd, buffer, 0, buffer.length, null);
      const offset = buffer.readInt32LE(0);
      this.offsets[i] = offset;
    }
  }

  public writeItems(items: number[]) {
    this.writeHeight(items.length);
    for (const item of items) {
      this.writeItem(item);
    }
  }

  public getOffsets() {
    return this.offsets;
  }

  public empty(): boolean {
    return this.offsets.length === 0;
  }
  get height(): number {
    return this._height;
  }

  public popOffsets() {
    this.offsets.pop();
    this.writeHeight(this.offsets.length);
  }

  public has(hash: IHash) {
    return this.blockHashes.indexOf(hash) !== -1;
  }

  public push(hash: IHash): boolean {
    if (this.blockHashes.indexOf(hash) !== -1) {
      return false;
    }
    this.blockHashes.push(hash);
    return true;
  }

  public pop(): IHash {
    return this.blockHashes.pop();
  }

  public getHeight(hash: IHash) {
    return this.blockHashes.indexOf(hash);
  }

  public size() {
    return this.blockHashes.length;
  }

  public clear() {
    this.blockHashes = [];
  }

  // Former getBlockId
  public getHash(idx: uint64) {
    assert(idx >= 0);
    assert(idx < this.blockHashes.length);
    return this.blockHashes[idx - 1];
  }

  // Former getBlockIds
  public getHashes(startIndex: uint64, maxCount: uint64) {
    const hashes = [];
    if (startIndex < 0 || startIndex >= this.blockHashes.length) {
      return hashes;
    }
    let maxIndex = this.blockHashes.length;
    if (startIndex + maxCount < maxIndex) {
      maxIndex = startIndex + maxIndex;
    }
    for (let i = startIndex; i < maxIndex; i++) {
      hashes.push(this.blockHashes[i]);
    }
    return hashes;
  }

  public findSupplement(hashes: IHash[]) {
    for (const hash of hashes) {
      const offset = this.getHeight(hash);
      if (offset) {
        return offset;
      }
    }
    return false;
  }

  public buildSparseChain(startHash: IHash) {
    const idx = this.getHeight(startHash);
    assert(idx >= 0);
    const sparseChainEnd = idx + 1;
    const result: IHash[] = [];
    for (let i = 1; i <= sparseChainEnd; i *= 2) {
      result.push(this.blockHashes[sparseChainEnd - i]);
    }
    if (!result[result.length - 1].equals(this.blockHashes[0])) {
      result.push(this.blockHashes[0]);
    }
    return result;
  }

  // getTailId
  public getTailHash() {
    assert(this.blockHashes.length);
    return this.blockHashes[this.blockHashes.length - 1];
  }

  get tail() {
    assert(this.blockHashes.length);
    return this.blockHashes[this.blockHashes.length - 1];
  }
}
