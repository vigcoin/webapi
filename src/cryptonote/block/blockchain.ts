import * as assert from 'assert';
import { parameters } from '../../config';
import { Configuration } from '../../config/types';
import { IHash, IKeyImage } from '../../crypto/types';
import { logger } from '../../logger';
import { medianValue } from '../../util/math';
import { unixNow } from '../../util/time';
import { Transaction } from '../transaction/index';
import {
  ETransactionIOType,
  IBlock,
  IBlockEntry,
  IInputKey,
  IInputSignature,
  ITransaction,
  ITransactionEntry,
  ITransactionIndex,
  ITransactionMultisignatureOutputUsage,
  uint16,
  uint64,
  usize,
} from '../types';
import { Block } from './block';
import { BlockIndex } from './block-index';

interface IOutputIndexPair {
  txIdx: ITransactionIndex;
  outputIdx: uint16;
}

export class BlockChain {
  public static genesis(block: Configuration.IBlock): Configuration.IGenesis {
    const genesisBlock = Block.genesis(block);
    const genesisBlockHash = Block.hash(genesisBlock);
    return {
      block: genesisBlock,
      hash: genesisBlockHash,
    };
  }

  public static hash(block: IBlock): Buffer {
    return Block.hash(block);
  }

  public static offsetsToAbsolute(offsets: uint64[]) {
    const result = [];
    let absolute = 0;
    for (const offset of offsets) {
      absolute += offset;
      result.push(absolute);
    }
    return result;
  }

  private files: Configuration.IBlockFile;
  private currency: Configuration.ICurrency;
  private blockIndex: BlockIndex;
  private block: Block;
  private offsets: uint64[];
  private cumulativeBlockSizeLimit: usize = 0;

  // caches
  private blockHashes: Set<IHash> = new Set();
  private transactionPairs: Map<IHash, ITransactionIndex> = new Map();
  private spendKeys: Set<IKeyImage> = new Set();
  private outputs: Map<uint64, IOutputIndexPair[]> = new Map();

  private multiSignatureOutputs: Map<
    uint64,
    ITransactionMultisignatureOutputUsage[]
  > = new Map();

  private initialized = false;

  constructor(config: Configuration.ICurrency) {
    this.currency = config;
    this.files = config.blockFiles;
    this.blockIndex = new BlockIndex(this.files.index);
    this.block = new Block(this.files.data);
    this.offsets = [0];
  }

  public genesis() {
    return BlockChain.genesis(this.currency.block);
  }

  public init() {
    this.blockIndex.init();
    if (!this.blockIndex.empty()) {
      const items = this.blockIndex.getOffsets();
      let offset = 0;
      for (const item of items) {
        offset += item;
        this.offsets.push(offset);
      }
    }
    this.initialized = true;
  }

  public cache() {
    logger.info('start blockchain caching');
    const start = Date.now();
    for (let i = 0; i < this.height; i++) {
      const be = this.get(i);
      const hash = Block.hash(be.block);
      this.blockHashes.add(hash);
      for (let j = 0; j < be.transactions.length; j++) {
        const te = be.transactions[j];
        const txHash = Transaction.hash(te.tx);
        const ti: ITransactionIndex = {
          block: i,
          transaction: j,
        };
        this.transactionPairs.set(txHash, ti);

        // process outputs
        let count = 0;
        for (const output of te.tx.prefix.outputs) {
          switch (output.tag) {
            case ETransactionIOType.KEY:
              {
                // const map = new Map<ITransactionIndex, uint16>();
                // map.set(ti, count);

                let value = this.outputs.get(output.amount);
                if (!value) {
                  value = [];
                }
                value.push({ txIdx: ti, outputIdx: count });
                this.outputs.set(output.amount, value);
              }
              break;
            case ETransactionIOType.SIGNATURE:
              {
                let value = this.multiSignatureOutputs.get(output.amount);
                if (!value) {
                  value = [];
                }
                value.push({
                  isUsed: false,
                  outputIndex: count,
                  transactionIndex: ti,
                });

                this.multiSignatureOutputs.set(output.amount, value);
              }
              break;
          }
          count++;
        }

        // process inputs
        for (const input of te.tx.prefix.inputs) {
          switch (input.tag) {
            case ETransactionIOType.KEY:
              const key = input.target as IInputKey;
              this.spendKeys.add(key.keyImage);
              break;
            case ETransactionIOType.SIGNATURE:
              const sign = input.target as IInputSignature;
              const usage = this.multiSignatureOutputs.get(sign.amount);
              if (usage && usage[sign.outputIndex]) {
                usage[sign.outputIndex].isUsed = true;
              }
              break;
          }
        }
      }
    }
    const end = Date.now();
    logger.info('Cached building completed!');
    logger.info('Time elasped:' + (end - start) / 1000);
  }

  public empty(): boolean {
    return this.block.empty();
  }

  public get(index: number): IBlockEntry {
    assert(this.initialized);
    assert(index >= 0);
    assert(index < this.height);
    return this.block.read(this.offsets[index], this.offsets[index + 1]);
  }

  get height(): uint64 {
    return this.blockIndex.height;
  }

  get circulatedCoins(): uint64 {
    if (this.height < 1) {
      return 0;
    }
    const be = this.get(this.height - 1);
    return be.generatedCoins;
  }

  public has(hash: IHash) {
    return this.blockHashes.has(hash);
  }

  public hasKeyImageAsSpend(keyImage: IHash) {
    return this.spendKeys.has(keyImage);
  }

  public have(hash: IHash): IBlockEntry {
    // logger.info('trying to found hash: ' + hash.toString('hex'));
    // logger.info('currenty height is ' + this.height);
    for (let i = this.height - 1; i > 0; i--) {
      // logger.info(' i is ' + i);
      try {
        const be = this.get(i);
        if (be.block.header.preHash.equals(hash)) {
          // logger.info('hash found, index: ', i - 1);
          return this.get(i - 1);
        }
      } catch (e) {
        logger.error(e);
        return;
      }
    }
  }

  public buildSparseChain() {
    const sparseChain: IHash[] = [];
    const height = this.height;
    let last = -1;

    for (let i = 1; i <= height; i *= 2) {
      last = height - i;
      const be = this.get(last);
      sparseChain.push(be.block.header.preHash);
    }

    if (last > 0) {
      const be = this.get(0);
      sparseChain.push(be.block.header.preHash);
    }
    if (!sparseChain.length) {
      sparseChain.push(this.genesis().block.header.preHash);
    }
    return sparseChain;
  }

  public haveTransaction(transaction: IHash): boolean {
    return !!this.transactionPairs.get(transaction);
  }

  public getHeightByHash(hash: IHash): ITransactionIndex {
    return this.transactionPairs.get(hash);
  }

  public getTransactionsWithMissed(
    txs: IHash[],
    missed: IHash[]
  ): ITransaction[] {
    const result: ITransaction[] = [];
    for (const tx of txs) {
      const ti = this.transactionPairs.get(tx);
      if (!ti) {
        missed.push(tx);
      } else {
        const be = this.get(ti.block);
        const te = be.transactions[ti.transaction];
        result.push(te.tx);
      }
    }
    return result;
  }

  public getTransactionEntryByIndex(
    index: ITransactionIndex
  ): ITransactionEntry {
    const be = this.get(index.block);
    return be.transactions[index.transaction];
  }

  public addNew(block: IBlock): boolean {
    try {
      const id: IHash = Block.hash(block);
      if (this.have(id)) {
        logger.info('Block with id = ' + id + ' already exists');
        return false;
      }
      // block.
    } catch (e) {
      logger.info(
        'Failed to get block hash, possible block has invalid format'
      );
      return false;
    }
    return true;
  }
  public hasOutput(amount: uint64) {
    return this.outputs.has(amount);
  }
  public getOutput(amount: uint64) {
    return this.outputs.get(amount);
  }

  public hasSignature(amount: uint64) {
    return this.multiSignatureOutputs.has(amount);
  }

  public getSignature(amount: uint64) {
    return this.multiSignatureOutputs.get(amount);
  }

  public isSpendtimeUnlocked(unlockTime: uint64) {
    if (unlockTime < parameters.CRYPTONOTE_MAX_BLOCK_NUMBER) {
      if (
        this.height +
          parameters.CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_BLOCKS -
          1 >=
        unlockTime
      ) {
        return true;
      }
    } else {
      const now = unixNow();
      if (
        now + parameters.CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_SECONDS >=
        unlockTime
      ) {
        return true;
      }
    }
    return false;
  }

  public getCurrentCumulativeBlockSizeLimit() {
    return this.cumulativeBlockSizeLimit;
  }

  public getBackwardBlocks(height: uint64, count: usize) {
    if (height >= this.height) {
      logger.error(
        'Internal error: get_backward_blocks_sizes called with from_height=' +
          height +
          ', blockchain height = ' +
          this.height
      );
      return;
    }

    const minor = height + 1 < count ? height + 1 : count;

    const start = height + 1 - minor;
    const blocks = [];
    for (let i = start; i < height + 1; i++) {
      blocks.push(this.get(i).size);
    }
    return blocks;
  }

  public getLastNBlocks(n: usize) {
    if (!this.height) {
      return;
    }
    return this.getBackwardBlocks(this.height - 1, n);
  }

  public updateNextCumulativeBlockSizeLimit() {
    const blocks = this.getLastNBlocks(
      parameters.CRYPTONOTE_REWARD_BLOCKS_WINDOW
    );

    let median = medianValue(blocks);
    if (median <= parameters.CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE) {
      median = parameters.CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE;
    }
    this.cumulativeBlockSizeLimit = median * 2;
    return true;
  }
}
