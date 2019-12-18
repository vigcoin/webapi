import { Amount, CNFashHash, HASH_LENGTH, IHash } from '@vigcoin/crypto';
import * as assert from 'assert';
import {
  closeSync,
  existsSync,
  openSync,
  readSync,
  statSync,
  writeSync,
} from 'fs';
import { parameters } from '../../config';
import { Configuration } from '../../config/types';
import { logger } from '../../logger';
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import { Transaction } from '../transaction';
import {
  IBlock,
  IBlockEntry,
  IBlockHeader,
  ITransaction,
  uint64,
  usize,
} from '../types';

export class Block {
  public static writeBlockHeader(
    writer: BufferStreamWriter,
    header: IBlockHeader
  ) {
    writer.writeVarint(header.version.major);
    writer.writeVarint(header.version.minor);
    writer.writeVarint(header.timestamp);
    writer.write(header.preHash);
    writer.writeUInt32(header.nonce);
  }

  public static readBlockHeader(reader: BufferStreamReader): IBlockHeader {
    const major = reader.readVarint();
    const minor = reader.readVarint();
    const timestamp = reader.readVarint();
    const preHash = reader.readHash();
    const nonce = reader.readUInt32();
    return {
      version: {
        major,
        minor,
        patch: 0,
      },
      // tslint:disable-next-line:object-literal-sort-keys
      timestamp,
      preHash,
      nonce,
    };
  }

  public static merkleHash(hashes: IHash[], start: number, end: number) {
    if (hashes.length === 1) {
      return hashes[0];
    }
    const gap = end - start;
    assert(gap < hashes.length);
    switch (gap) {
      case 0:
        return Buffer.from(
          CNFashHash(Buffer.concat([hashes[start], hashes[start]])),
          'hex'
        );
      case 1:
        return Buffer.from(
          CNFashHash(Buffer.concat([hashes[start], hashes[start + 1]])),
          'hex'
        );
      default:
        const mid = gap / 2;
        return Buffer.from(
          CNFashHash(
            Buffer.concat([
              Block.merkleHash(hashes, start, mid),
              Block.merkleHash(hashes, mid + 1, end),
            ])
          ),
          'hex'
        );
    }
  }

  // Generate Hash for a block
  public static hash(block: IBlock): Buffer {
    return Buffer.from(CNFashHash(Block.toBuffer(block)), 'hex');
  }

  // Generate Hash for a block
  public static toBuffer(block: IBlock): Buffer {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    this.writeBlockHeader(writer, block.header);
    const hash = Transaction.hash(block.transaction);
    const hashes = [hash];
    for (const h of block.transactionHashes) {
      hashes.push(h);
    }
    const finalHash = Block.merkleHash(hashes, 0, hashes.length - 1);

    writer.writeHash(finalHash);
    writer.writeVarint(block.transactionHashes.length + 1);

    const finalWriter = new BufferStreamWriter(Buffer.alloc(0));
    finalWriter.writeVarint(writer.getBuffer().length);
    finalWriter.write(writer.getBuffer());
    return finalWriter.getBuffer();
  }

  // Generate genesis block
  public static genesis(conf: Configuration.ICBlock): IBlock {
    const genesis = Buffer.from(conf.genesisCoinbaseTxHex, 'hex');
    const reader: BufferStreamReader = new BufferStreamReader(genesis);
    const transaction: ITransaction = Transaction.read(reader);
    return {
      header: {
        nonce: 70,
        preHash: Buffer.alloc(HASH_LENGTH),
        timestamp: 0,
        version: conf.version,
      },
      transaction,
      transactionHashes: [],
    };
  }

  public static readBlock(reader): IBlock {
    const header = Block.readBlockHeader(reader);
    const transaction = Transaction.read(reader);
    const count = reader.readVarint();
    const transactionHashes = [];
    for (let i = 0; i < count; i++) {
      transactionHashes.push(reader.readHash());
    }
    return {
      header,
      transaction,
      transactionHashes,
    };
  }

  public static writeBlock(writer: BufferStreamWriter, block: IBlock) {
    Block.writeBlockHeader(writer, block.header);
    Transaction.write(writer, block.transaction);
    writer.writeVarint(block.transactionHashes.length);
    for (const hash of block.transactionHashes) {
      writer.writeHash(hash);
    }
  }

  public static getReward(
    medianSize: usize,
    currentBlockSize: usize,
    alreadyGeneratedCoins: uint64,
    fee: uint64
  ) {
    assert(alreadyGeneratedCoins <= parameters.MONEY_SUPPLY);
    assert(parameters.EMISSION_SPEED_FACTOR > 0);
    assert(parameters.EMISSION_SPEED_FACTOR <= 8 * 8);
    // tslint:disable-next-line:no-bitwise
    let baseReward =
      // tslint:disable-next-line:no-bitwise
      (parameters.MONEY_SUPPLY - alreadyGeneratedCoins) >>>
      parameters.EMISSION_SPEED_FACTOR;
    if (alreadyGeneratedCoins === 0) {
      baseReward =
        (parameters.MONEY_SUPPLY * parameters.PREMINED_PERCENTAGE) / 100;
    }
    if (alreadyGeneratedCoins + baseReward >= parameters.MONEY_SUPPLY) {
      baseReward = 0;
    }
    if (medianSize < parameters.CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE) {
      medianSize = parameters.CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE;
    }

    if (currentBlockSize > 2 * medianSize) {
      logger.error(
        'Block cumulative size is too big: ' +
          currentBlockSize +
          ', expected less than ' +
          2 * medianSize
      );
      return false;
    }

    const penalizedBaseReward = Amount.getPenalized(
      baseReward,
      medianSize,
      currentBlockSize
    );
    const penalizedFee = Amount.getPenalized(fee, medianSize, currentBlockSize);
    const emission = penalizedBaseReward - (fee - penalizedFee);
    const reward = penalizedBaseReward + penalizedFee;
    return {
      emission,
      reward,
    };
  }

  private filename: string;
  private offsets: uint64[];

  constructor(filename: string) {
    this.filename = filename;
    this.offsets = [0];
  }

  public empty(): boolean {
    if (!existsSync(this.filename)) {
      return true;
    }
    const stat = statSync(this.filename);
    if (stat.size === 0) {
      return true;
    }
    return false;
  }

  public read(offset: number, length: number): IBlockEntry {
    const fd = openSync(this.filename, 'r');
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, offset);
    const reader = new BufferStreamReader(buffer);
    const block = Block.readBlock(reader);
    const height = reader.readVarint();
    const size = reader.readVarint();
    const difficulty = reader.readVarint();
    const generatedCoins = reader.readVarint();
    const transactionSize = reader.readVarint();
    const transactions = [];
    for (let i = 0; i < transactionSize; i++) {
      transactions.push(Transaction.readEntry(reader));
    }
    closeSync(fd);
    return {
      block,
      height,
      size,
      // tslint:disable-next-line:object-literal-sort-keys
      difficulty,
      generatedCoins,
      transactions,
    };
  }
  public write(blockEntry: IBlockEntry, offset: number = 0) {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Block.writeBlock(writer, blockEntry.block);
    writer.writeVarint(blockEntry.height);
    writer.writeVarint(blockEntry.size);
    writer.writeVarint(blockEntry.difficulty);
    writer.writeVarint(blockEntry.generatedCoins);
    writer.writeVarint(blockEntry.transactions.length);
    for (const tx of blockEntry.transactions) {
      Transaction.writeEntry(writer, tx);
    }
    const fd = openSync(this.filename, 'r+');
    writeSync(fd, writer.getBuffer(), offset);
    closeSync(fd);
    return writer.getBuffer().length;
  }

  public init(items: uint64[]) {
    let offset = 0;
    for (const item of items) {
      offset += item;
      this.offsets.push(offset);
    }
  }

  public get(index: number) {
    return this.read(this.offsets[index], this.offsets[index + 1]);
  }

  public pop() {
    const offset = this.offsets.pop();
    const fd = openSync(this.filename, 'r+');
    writeSync(fd, '', offset);
    closeSync(fd);
  }

  public push(be: IBlockEntry) {
    const offset = this.offsets[this.offsets.length - 1];
    const length = this.write(be, offset);
    this.offsets.push(offset + length);
  }

  get height() {
    return this.offsets.length;
  }

  get last() {
    return this.get(this.height - 1);
  }
}
