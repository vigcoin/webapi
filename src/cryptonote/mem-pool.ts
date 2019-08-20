import * as assert from 'assert';
import { closeSync, existsSync, openSync, readFileSync } from 'fs';
import { BufferStreamReader } from './serialize/reader';
import { uint8 } from './types';

const CURRENT_MEMPOOL_ARCHIVE_VER = 1;

export class MemoryPool {
  private filename: string;
  private fd: number;
  private version: uint8 = 0;

  // private transactionDetails:
  constructor(filename: string) {
    this.filename = filename;
  }
  public init() {
    if (!existsSync(this.filename)) {
      closeSync(openSync(this.filename, 'w'));
    }
    const buffer = readFileSync(this.filename);
    if (buffer.length) {
      const reader = new BufferStreamReader(buffer);
      this.version = reader.readVarint();
      assert(this.version === CURRENT_MEMPOOL_ARCHIVE_VER);
      this.readTransaction(reader);
      this.readKeyImage(reader);
      this.readSpendOutputs(reader);
      this.readRecentDeletedTransaction(reader);
    }
  }

  public readTransaction(reader: BufferStreamReader) {
    const length = reader.readVarint();
  }

  // public readTransactionDetails(reader: BufferStreamReader) {

  // }

  public readKeyImage(reader: BufferStreamReader) {
    const length = reader.readVarint();
  }

  public readSpendOutputs(reader: BufferStreamReader) {
    const length = reader.readVarint();
  }

  public readRecentDeletedTransaction(reader: BufferStreamReader) {
    const length = reader.readVarint();
  }
}
