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
import { P2pConnectionContext } from '../p2p/connection';
import { Transaction } from './transaction/index';
import { TransactionPrefix } from './transaction/prefix';
import {
  ETransactionIOType,
  IGlobalOut,
  IInputKey,
  IInputSignature,
  ITransaction,
  ITransactionCheckInfo,
  ITransactionDetails,
  ITxVerificationContext,
  uint64,
  uint8,
  usize,
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

  private transactions: Map<IHash, ITransactionDetails> = new Map<
    IHash,
    ITransactionDetails
  >();
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
    for (let i = 0; i < length; i++) {
      const transactionDetails = this.readTransactionDetails(reader);
      this.transactions.set(transactionDetails.id, transactionDetails);
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
      this.spendOutputs.add(key + '+' + value);
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
    this.transactions.forEach((transaction, key) => {
      this.payment.add(transaction.tx);
      this.timestamp.add(transaction.receiveTime, transaction.id);
    });
  }

  public removeExpiredTransactions() {
    const now = Date.now();
    this.recentDeletedTransactions.forEach((value, key, item) => {
      const elapsedTimeSinceDeletion = now - value;
      if (isForgetable(elapsedTimeSinceDeletion)) {
        item.delete(key);
      }
    });
    this.transactions.forEach((transaction, key) => {
      const age = now - toUnixTimeStamp(transaction.receiveTime);
      if (age > getLiveTime(transaction.keptByBlock)) {
        logger.info(
          'Tx :' +
            transaction.id.toString('hex') +
            ' removed from tx pool due to outdated, age: ' +
            age
        );
        this.recentDeletedTransactions.set(transaction.id, now);
        this.removeTransactionInputs(transaction);
        this.payment.remove(transaction.tx);
        this.timestamp.remove(transaction.receiveTime, transaction.id);
        this.transactions.delete(key);
        this.emit(TX_REMOVED_FROM_POOL, transaction);
      }
    });
  }

  public removeTransactionInputs(td: ITransactionDetails) {
    for (const input of td.tx.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          const key = input.target as IInputKey;
          const images = this.spendKeyImages.get(key.keyImage);
          if (!images) {
            logger.info('Failed to find transaction input in key images!');
            logger.info('Transaction id: ' + td.id.toString('hex'));
            return false;
          }
          if (!images.size) {
            logger.info('Empty key image set!');
            logger.info('Transaction id: ' + td.id.toString('hex'));
            return false;
          }
          if (!images.has(td.id)) {
            logger.info('Transaction id not found in key_image set!');
            logger.info('Transaction id: ' + td.id.toString('hex'));
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
            // output.set(signature.amount, signature.outputIndex);
            const spendOutput = signature.amount + '+' + signature.outputIndex;
            assert(this.spendOutputs.has(spendOutput));
            this.spendOutputs.delete(spendOutput);
          }
          break;
      }
    }
  }

  public haveTx(tx: IHash) {
    return this.transactions.has(tx);
  }

  public addTxBuffer(
    context: P2pConnectionContext,
    txBuffer: Buffer,
    tvc: ITxVerificationContext,
    keptByBlock: boolean
  ) {
    const tx = Transaction.read(new BufferStreamReader(txBuffer));
    return this.addTx(context, tx, txBuffer.length, tvc, keptByBlock);
  }

  public addTx(
    context: P2pConnectionContext,
    tx: ITransaction,
    size: usize,
    tvc: ITxVerificationContext,
    keptByBlock: boolean
  ): boolean {
    // const tx = Transaction.read(new BufferStreamReader(txBuffer));
    const hash = Transaction.hash(tx);
    const preHash = TransactionPrefix.hash(tx.prefix);

    if (!TransactionValidator.checkInputsTypes(tx.prefix)) {
      logger.info('Input type not supported!');
      tvc.verifivationFailed = true;
      return false;
    }

    if (!TransactionAmount.check(tx)) {
      tvc.verifivationFailed = true;
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
      tvc.verifivationFailed = true;
      tvc.txFeeTooSmall = true;
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
        tvc.verifivationFailed = true;
        return false;
      }
    }

    const checkInfo: ITransactionCheckInfo = {
      lastFailedBlock: {
        height: 0,
        id: Buffer.alloc(0),
      },
      maxUsedBlock: {
        height: 0,
        id: Buffer.alloc(0),
      },
    };

    if (
      !TransactionValidator.checkInputs(
        context,
        tx,
        hash,
        preHash,
        keptByBlock,
        checkInfo
      )
    ) {
      if (!keptByBlock) {
        logger.info('tx used wrong inputs, rejected');
        tvc.verifivationFailed = true;
        return false;
      }
      logger.info('Impossible to validate');
    }
    if (!keptByBlock) {
      if (!TransactionValidator.checkSize(context, size)) {
        logger.info('tx too big, rejected');
        tvc.verifivationFailed = true;
        return false;
      }

      if (this.recentDeletedTransactions.has(hash)) {
        logger.info(
          'Trying to add recently deleted transaction. Ignore: ' +
            hash.toString('hex')
        );
        tvc.verifivationFailed = false;
        tvc.shouldBeRelayed = false;
        tvc.addedToPool = false;
        return true;
      }
    }

    if (this.transactions.has(hash)) {
      logger.error('transaction already exists at inserting in memory pool');
      return true;
    }
    const tdx: ITransactionDetails = {
      blobSize: size,
      checkInfo,
      fee,
      id: hash,
      keptByBlock,
      receiveTime: new Date(),
      tx,
    };

    this.transactions.set(hash, tdx);
    this.payment.add(tdx.tx);
    this.timestamp.add(tdx.receiveTime, hash);
    tvc.addedToPool = true;
    tvc.shouldBeRelayed = fee > 0 || isFusion;
    tvc.verifivationFailed = true;

    logger.info('tx added: ' + hash);
    this.emit('updated', hash);
    if (this.addTransactionInputs(hash, tx, keptByBlock)) {
      return false;
    }
    tvc.verifivationFailed = true;
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
            const spendOutput = signature.amount + '+' + signature.outputIndex;
            const found = this.spendOutputs.has(spendOutput);
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
    this.transactions.forEach(transaction => {
      transactions.push(transaction.tx);
    });
    return transactions;
  }

  public getTransactionsByIds(hashes: IHash[]) {
    const blockTxs: ITransaction[] = [];
    const missedTxs: IHash[] = [];
    for (const hash of hashes) {
      const txe = this.transactions.get(hash);
      if (txe) {
        blockTxs.push(txe.tx);
      } else {
        missedTxs.push(hash);
      }
    }
    return {
      blockTxs,
      missedTxs,
    };
  }

  public addTransactionInputs(
    id: IHash,
    tx: ITransaction,
    keptByBlock: boolean
  ): boolean {
    for (const input of tx.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          const keyInput = input.target as IInputKey;
          const keyImageSet = this.spendKeyImages.get(keyInput.keyImage);
          if (!keptByBlock && keyImageSet.size !== 0) {
            logger.error(
              'Internal error: keptByBlock =' +
                keptByBlock +
                ',  keyImageSet.size =' +
                keyImageSet.size
            );
            logger.error(
              'keyInput.keyImage =' + keyInput.keyImage.toString('hex')
            );
            logger.error('tx id = ' + id);
            return false;
          }

          if (keyImageSet.has(id)) {
            logger.error(
              'Internal error: try to insert duplicate iterator in key image set'
            );
            return false;
          }
          keyImageSet.add(id);
          break;
        case ETransactionIOType.SIGNATURE:
          if (!keptByBlock) {
            const signature = input.target as IInputSignature;
            const spendOutput = signature.amount + '+' + signature.outputIndex;
            assert(!this.spendOutputs.has(spendOutput));
            this.spendOutputs.add(spendOutput);
          }
          break;
      }
    }

    return true;
  }

  public takeTx(id: IHash): ITransactionDetails {
    return this.transactions.get(id);
  }
}
