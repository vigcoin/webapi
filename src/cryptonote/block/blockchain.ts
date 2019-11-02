import * as assert from 'assert';
import { parameters } from '../../config';
import { Configuration } from '../../config/types';
import { CNCheckHash, CNSlowHash, IHash, IKeyImage } from '../../crypto/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { medianValue } from '../../util/math';
import { unixNow } from '../../util/time';
import { Transaction } from '../transaction/index';
import {
  ETransactionIOType,
  IBlock,
  IBlockEntry,
  IBlockVerificationContext,
  IInputBase,
  IInputKey,
  IInputSignature,
  ITransaction,
  ITransactionDetails,
  ITransactionEntry,
  ITransactionIndex,
  ITransactionMultisignatureOutputUsage,
  ITxVerificationContext,
  uint16,
  uint64,
  usize,
} from '../types';
import { AlternativeBlockchain } from './alternative';
import { Block } from './block';
import { BlockIndex } from './block-index';
import { CheckPoint } from './checkpoint';
import { Hardfork } from './hardfork';

interface IOutputIndexPair {
  txIdx: ITransactionIndex;
  outputIdx: uint16;
}

export class BlockChain {
  public static genesis(block: Configuration.ICBlock): Configuration.IGenesis {
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

  public alternativeChain: Map<IHash, IBlockEntry> = new Map();
  public checkpoint: CheckPoint;
  public hardfork: Hardfork;

  private files: Configuration.ICBlockFile;
  private currency: Configuration.ICCurrency;
  private blockIndex: BlockIndex;
  private block: Block;
  private offsets: uint64[];
  private cumulativeBlockSizeLimit: usize = 0;

  // caches
  private transactionPairs: Map<IHash, ITransactionIndex> = new Map();
  private spendKeys: Set<IKeyImage> = new Set();
  private outputs: Map<uint64, IOutputIndexPair[]> = new Map();

  private multiSignatureOutputs: Map<
    uint64,
    ITransactionMultisignatureOutputUsage[]
  > = new Map();

  private initialized = false;

  constructor(config: Configuration.ICCurrency) {
    this.currency = config;
    this.files = config.blockFiles;
    this.blockIndex = new BlockIndex(this.files.index);
    this.block = new Block(this.files.data);
    this.hardfork = new Hardfork(config.hardforks);
    this.checkpoint = new CheckPoint(config.checkpoints);
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
      this.blockIndex.push(hash);
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

  public hasKeyImageAsSpend(keyImage: IHash) {
    return this.spendKeys.has(keyImage);
  }

  public has(hash: IHash) {
    return this.blockIndex.has(hash);
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

  public getHeightByIndex(hash: IHash) {
    return this.blockIndex.getHeight(hash);
  }

  public getHeightByHash(hash: IHash): ITransactionIndex {
    return this.transactionPairs.get(hash);
  }

  public getHeightByBlock(block: IBlock) {
    if (block.transaction.prefix.inputs.length !== 1) {
      return 0;
    }
    const input = block.transaction.prefix.inputs[0];
    if (input.tag !== ETransactionIOType.BASE) {
      return 0;
    }
    return (input.target as IInputBase).blockIndex;
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

  public getTailId() {
    if (this.blockIndex.height === 0) {
      return Buffer.alloc(0);
    }
    return this.blockIndex.getTailHash();
  }

  public addNew(
    context: P2pConnectionContext,
    block: IBlock,
    bvc: IBlockVerificationContext
  ): boolean {
    try {
      const id: IHash = Block.hash(block);
      if (this.have(id)) {
        logger.info('Block with id = ' + id + ' already exists');
        bvc.alreadyExists = true;
        return false;
      }
      let result = false;
      if (!block.header.preHash.equals(this.getTailId())) {
        bvc.addedToMainChain = false;
        result = AlternativeBlockchain.handle(context, id, block, bvc, true);
      } else {
        // result = pushBlock()
      }
      // check that block refers to chain tail
      // if (!(bl.previousBlockHash == getTailId())) {
      //   //chain switching or wrong block
      //   bvc.m_added_to_main_chain = false;
      //   add_result = handle_alternative_block(bl, id, bvc);
      // } else {
      //   add_result = pushBlock(bl, bvc);
      //   if (add_result) {
      //     sendMessage(BlockchainMessage(NewBlockMessage(id)));
      //   }
      // }
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

  public loadTransactions(
    context: P2pConnectionContext,
    block: IBlock
  ): ITransaction[] {
    const transactions = Array(block.transactionHashes.length);
    for (let i = 0; i < block.transactionHashes.length; i++) {
      const txe: ITransactionDetails = context.mempool.takeTx(
        block.transactionHashes[i]
      );
      if (!txe) {
        const tvc: ITxVerificationContext = {
          addedToPool: false,
          shouldBeRelayed: false,
          txFeeTooSmall: false,
          verifivationFailed: false,
          verifivationImpossible: false,
        };
        for (let j = 0; j < i; j++) {
          if (
            !context.mempool.addTx(
              context,
              transactions[i - 1 - j],
              txe.blobSize,
              tvc,
              true
            )
          ) {
            throw new Error(
              'Blockchain::loadTransactions, failed to add transaction to pool'
            );
          }
        }
        return;
      }
      transactions[i] = txe.tx;
    }
    return transactions;
  }

  public getTransactions(
    context: P2pConnectionContext,
    hashes: IHash[],
    checkPool: boolean = false
  ) {
    let blockTxs: ITransaction[] = [];
    let missedTxs: IHash[] = [];
    for (const hash of hashes) {
      const tidx = this.transactionPairs.get(hash);
      if (tidx) {
        const txe = this.getTransactionEntryByIndex(tidx);
        blockTxs.push(txe.tx);
      } else {
        missedTxs.push(hash);
      }
    }
    if (checkPool) {
      const extra = context.mempool.getTransactionsByIds(missedTxs);
      blockTxs = blockTxs.concat(extra.blockTxs);
      missedTxs = extra.missedTxs;
    }
    return {
      blockTxs,
      missedTxs,
    };
  }

  public getCumulativeSize(context: P2pConnectionContext, block: IBlock) {
    const { blockTxs, missedTxs } = this.getTransactions(
      context,
      block.transactionHashes,
      true
    );
    let cumulativeSize = Transaction.size(block.transaction);
    for (const tx of blockTxs) {
      cumulativeSize += Transaction.size(tx);
    }
    if (!missedTxs.length) {
      return false;
    }
    return cumulativeSize;
  }

  public checkCumulativeSize(hash: IHash, size: usize, height: uint64) {
    const maxCumulativeSize = this.maxCumulativeSize(height);
    if (size > maxCumulativeSize) {
      logger.info(
        'Block ' +
          hash.toString('hex') +
          ' is too big: ' +
          size +
          ' bytes, ' +
          'exptected no more than ' +
          maxCumulativeSize +
          ' bytes'
      );
      return false;
    }
    return true;
  }

  public maxCumulativeSize(size: uint64) {
    const sizedSpeedNumberator =
      size * parameters.MAX_BLOCK_SIZE_GROWTH_SPEED_NUMERATOR;
    assert(sizedSpeedNumberator < Number.MAX_SAFE_INTEGER);
    const maxSize = Math.floor(
      parameters.MAX_BLOCK_SIZE_INITIAL +
        sizedSpeedNumberator /
          parameters.MAX_BLOCK_SIZE_GROWTH_SPEED_DENOMINATOR
    );
    assert(maxSize >= parameters.MAX_BLOCK_SIZE_INITIAL);
    return maxSize;
  }

  public getLongHash(block: IBlock): IHash {
    const buffer = Block.toBuffer(block);
    return CNSlowHash(buffer, this.hardfork.getVariant(block));
  }

  public checkProofOfWork(block: IBlock, difficulty: uint64): boolean {
    const hash = this.getLongHash(block);
    return CNCheckHash(hash, difficulty);
  }
}
