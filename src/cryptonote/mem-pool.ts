import * as assert from 'assert';
import { closeSync, existsSync, openSync, readFileSync } from 'fs';
import { IHash, IKeyImage } from '../crypto/types';
import { BufferStreamReader } from './serialize/reader';
import { TransactionDetails } from './transaction/detail';
import { Payment } from './transaction/payment';
import { IGlobalOut, ITransactionDetails, uint64, uint8 } from './types';

const CURRENT_MEMPOOL_ARCHIVE_VER = 1;

export class MemoryPool {
  private filename: string;
  private fd: number;
  private version: uint8 = 0;

  private transactions: ITransactionDetails[] = [];
  private spendKeyImages: Map<IHash, IKeyImage[]> = new Map<
    IHash,
    IKeyImage[]
  >();
  private recentDeletedTransactions: Map<IHash, uint64> = new Map<
    IHash,
    uint64
  >();
  private spendOutputs: Set<IGlobalOut> = new Set<IGlobalOut>();

  private payments: Payment;

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
    this.transactions = [];
    for (let i = 0; i < length; i++) {
      const transactionDetails = this.readTransactionDetails(reader);
      this.transactions.push(transactionDetails);
    }
  }

  public readTransactionDetails(reader: BufferStreamReader) {
    return TransactionDetails.read(reader);
  }

  public readKeyImage(reader: BufferStreamReader) {
    const length = reader.readVarint();
    this.transactions = [];
    for (let i = 0; i < length; i++) {
      const { key, images } = this.readSpendKeyImage(reader);
      this.spendKeyImages.set(key, images);
    }
  }

  public readSpendKeyImage(reader: BufferStreamReader) {
    const key = reader.readHash();
    const length = reader.readVarint();
    const images = [];
    for (let i = 0; i < length; i++) {
      const image = reader.readHash();
      images.push(image);
    }
    return { key, images };
  }

  public readSpendOutputs(reader: BufferStreamReader) {
    const length = reader.readVarint();
    this.spendOutputs.clear();
    for (let i = 0; i < length; i++) {
      const key = reader.readVarint();
      const value = reader.readVarint();
      const map: IGlobalOut = new Map();
      map.set(key, value);
      this.spendOutputs.add(map);
    }
  }

  public readRecentDeletedTransaction(reader: BufferStreamReader) {
    const length = reader.readVarint();
    this.recentDeletedTransactions.clear();
    for (let i = 0; i < length; i++) {
      const key = reader.readHash();
      const value = reader.readVarint();
      this.recentDeletedTransactions.set(key, value);
    }
  }

  public buildIndices() {}
}
