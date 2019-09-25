import * as assert from 'assert';
import { EventEmitter } from 'events';
import { closeSync, existsSync, openSync, readFileSync } from 'fs';
import { TX_REMOVED_FROM_POOL } from '../config/events';
import { IHash, IKeyImage } from '../crypto/types';
import { getLiveTime, isForgetable } from '../init/mem-pool';
import { logger } from '../logger';
import { toUnixTimeStamp } from '../util/time';
import { BufferStreamReader } from './serialize/reader';
import { TransactionAmount } from './transaction/amount';
import { TransactionDetails } from './transaction/detail';
import { Payment } from './transaction/payment';
import { TimeStamp } from './transaction/timestamp';
import { TransactionValidator } from './transaction/validator';

import { parameters } from '../config';
import {
  ETransactionIOType,
  IGlobalOut,
  IInputKey,
  IInputSignature,
  ITransaction,
  ITransactionDetails,
  uint64,
  uint8,
} from './types';

const CURRENT_MEMPOOL_ARCHIVE_VER = 1;

export class BlockTemplate {
  private txHashes: IHash[];
}

// tslint:disable-next-line:max-classes-per-file
export class MemoryPool extends EventEmitter {
  private filename: string;
  private fd: number;
  private version: uint8 = 0;

  private transactions: ITransactionDetails[] = [];
  private spendKeyImages: Map<IHash, Set<IKeyImage>> = new Map<
    IHash,
    Set<IKeyImage>
  >();
  private recentDeletedTransactions: Map<IHash, uint64> = new Map<
    IHash,
    uint64
  >();
  private spendOutputs: Set<IGlobalOut> = new Set<IGlobalOut>();

  private payment: Payment = new Payment();
  private timestamp: TimeStamp = new TimeStamp();

  private interval: number = 10000;

  // private transactionDetails:
  constructor(filename: string) {
    super();
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
    this.buildIndices();
    this.removeExpiredTransactions();
  }

  public onIdle() {
    setTimeout(() => {
      this.removeExpiredTransactions();
    }, this.interval);
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
    for (let i = 0; i < length; i++) {
      const { key, images } = this.readSpendKeyImage(reader);
      this.spendKeyImages.set(key, images);
    }
  }

  public readSpendKeyImage(reader: BufferStreamReader) {
    const key = reader.readHash();
    const length = reader.readVarint();
    const images = new Set<IKeyImage>();
    for (let i = 0; i < length; i++) {
      const image = reader.readHash();
      images.add(image);
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

  public buildIndices() {
    for (const transaction of this.transactions) {
      this.payment.add(transaction.tx);
      this.timestamp.add(transaction.receiveTime, transaction.id);
    }
  }

  public removeExpiredTransactions() {
    const now = Date.now();
    this.recentDeletedTransactions.forEach((value, key, item) => {
      const elapsedTimeSinceDeletion = now - value;
      if (isForgetable(elapsedTimeSinceDeletion)) {
        item.delete(key);
      }
    });
    for (let i = 0; i < this.transactions.length; i++) {
      const td = this.transactions[i];
      const age = now - toUnixTimeStamp(td.receiveTime);
      if (age > getLiveTime(td.keptByBlock)) {
        logger.info(
          'Tx :' + td.id + ' removed from tx pool due to outdated, age: ' + age
        );
        this.recentDeletedTransactions.set(td.id, now);
        this.removeTransactionInputs(td);
        this.payment.remove(td.tx);
        this.timestamp.remove(td.receiveTime, td.id);
        this.transactions.splice(i, 1);
        i--;
        this.emit(TX_REMOVED_FROM_POOL, td);
      }
    }
  }

  public removeTransactionInputs(td: ITransactionDetails) {
    for (const input of td.tx.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          const key = input.target as IInputKey;
          const images = this.spendKeyImages.get(key.keyImage);
          if (!images) {
            logger.info('Failed to find transaction input in key images!');
            logger.info('Transaction id: ' + td.id);
            return false;
          }
          if (!images.size) {
            logger.info('Empty key image set!');
            logger.info('Transaction id: ' + td.id);
            return false;
          }
          if (!images.has(td.id)) {
            logger.info('Transaction id not found in key_image set!');
            logger.info('Transaction id: ' + td.id);
            return false;
          }

          images.delete(td.id);

          if (images.size === 0) {
            this.spendKeyImages.delete(key.keyImage);
          }
          break;
        case ETransactionIOType.SIGNATURE:
          if (!td.keptByBlock) {
            const signature = input.target as IInputSignature;
            const output: IGlobalOut = new Map();
            output.set(signature.amount, signature.outputIndex);
            assert(this.spendOutputs.has(output));
            this.spendOutputs.delete(output);
          }
          break;
      }
    }
  }

  public haveTx(tx: IHash) {
    for (const details of this.transactions) {
      if (tx.equals(details.id)) {
        return true;
      }
    }
    return false;
  }

  public addTx(tx: ITransaction, hash: IHash, keptByBlock: boolean) {
    if (!TransactionValidator.checkInputsTypes(tx.prefix)) {
      return false;
    }

    if (!TransactionAmount.check(tx)) {
      return false;
    }

    const fee = TransactionAmount.getFee(tx);
    const isFusion = TransactionValidator.isFusion(tx, hash);
    if (!keptByBlock && !isFusion && fee < parameters.MINIMUM_FEE) {
      logger.info(
        'transaction fee is not enough: ' + TransactionAmount.format(fee)
      );
      logger.info(
        'minimum fee: ' + TransactionAmount.format(parameters.MINIMUM_FEE)
      );
      return false;
    }

    // Check key images for transaction if it is not kept by block
    if (!keptByBlock) {
      if (this.haveSpentInputs(tx)) {
        logger.info(
          'transaction_t with id= ' +
            hash.toString('hex') +
            ' used already spent inputs'
        );
        return false;
      }
    }
    return true;
  }

  public haveSpentInputs(transaction: ITransaction) {
    for (const input of transaction.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          {
            const key = input.target as IInputKey;
            const found = this.spendKeyImages.get(key.keyImage);
            if (found) {
              return true;
            }
          }
          break;
        case ETransactionIOType.SIGNATURE:
          {
            const signature = input.target as IInputSignature;
            const map = new Map();
            map.set(signature.amount, signature.outputIndex);
            const found = this.spendOutputs.has(map);
            if (found) {
              return true;
            }
          }
          break;
      }
    }
    return false;
  }

  public getTransactions(): ITransaction[] {
    const transactions = [];
    for (const transaction of this.transactions) {
      transactions.push(transaction.tx);
    }
    return transactions;
  }
}
