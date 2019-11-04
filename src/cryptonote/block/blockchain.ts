import * as assert from 'assert';
import { parameters } from '../../config';
import { Configuration } from '../../config/types';
import { CNCheckHash, CNSlowHash, IHash, IKeyImage } from '../../crypto/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { medianValue } from '../../util/math';
import { fromUnixTimeStamp, unixNow } from '../../util/time';
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

import { GeneratedTransaction } from '../indexing/generated-transactions';
import { Payment } from '../indexing/payment';
import { TimeStamp } from '../indexing/timestamp';
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
  // private offsets: uint64[];
  private cumulativeBlockSizeLimit: usize = 0;

  // caches
  private transactionPairs: Map<IHash, ITransactionIndex> = new Map();
  private spendKeys: Set<IKeyImage> = new Set();
  private outputs: Map<uint64, IOutputIndexPair[]> = new Map();
  private payment: Payment = new Payment();
  private timestamp: TimeStamp = new TimeStamp();
  private generatedTransaction: GeneratedTransaction = new GeneratedTransaction();

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
  }

  public genesis() {
    return BlockChain.genesis(this.currency.block);
  }

  public init() {
    this.blockIndex.init();
    if (!this.blockIndex.empty()) {
      this.block.init(this.blockIndex.getOffsets());
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
    return this.block.get(index);
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
            !context.mempool.addTx(context, transactions[i - 1 - j], tvc, true)
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

  public pop(context: P2pConnectionContext, idx: number): IBlock {
    const block = this.get(idx).block;
    if (!this.height) {
      logger.error('Attempt to pop block from empty blockchain.');
      return;
    }
    const transactions: ITransaction[] = [];
    const lastBlock = this.get(this.height - 1);
    const maxLength = lastBlock.transactions.length - 1;
    for (let i = 0; i < maxLength; i++) {
      transactions.push(lastBlock.transactions[i + 1].tx);
    }

    this.saveTransactions(context, transactions);
    this.popTransactions(
      lastBlock,
      Transaction.hash(lastBlock.block.transaction)
    );

    this.timestamp.remove(
      fromUnixTimeStamp(lastBlock.block.header.timestamp),
      Block.hash(block)
    );

    this.generatedTransaction.remove(block);
    this.block.pop();
    this.blockIndex.popOffsets();
    assert(this.blockIndex.height === this.block.height);
    return block;
  }

  // Transactions

  public saveTransactions(
    context: P2pConnectionContext,
    transactions: ITransaction[]
  ) {
    const tvc: ITxVerificationContext = {
      addedToPool: false,
      shouldBeRelayed: false,
      txFeeTooSmall: false,
      verifivationFailed: false,
      verifivationImpossible: false,
    };
    for (const tx of transactions) {
      assert(context.mempool.addTx(context, tx, tvc, true));
    }
  }

  public popTransactions(be: IBlockEntry, hash: IHash) {
    for (let i = 0; i < be.transactions.length - 1; i--) {
      this.popTransaction(
        be.transactions[be.transactions.length - 1 - i].tx,
        be.block.transactionHashes[be.transactions.length - 2 - i]
      );
    }
  }

  public popTransaction(transaction: ITransaction, hash: IHash) {
    const transactionIndex = this.transactionPairs.get(hash);
    for (
      let outputIndex = 0;
      outputIndex < transaction.prefix.outputs.length;
      outputIndex++
    ) {
      const output =
        transaction.prefix.outputs[
          transaction.prefix.outputs.length - 1 - outputIndex
        ];
      switch (output.tag) {
        case ETransactionIOType.KEY:
          {
            const amountOutputs = this.outputs.get(output.amount);
            if (!amountOutputs.length) {
              logger.error(
                'Blockchain consistency broken - cannot find specific amount in outputs map.'
              );
              continue;
            }
            const last = amountOutputs[amountOutputs.length - 1];
            if (
              last.txIdx.block !== transactionIndex.block ||
              last.txIdx.transaction !== transactionIndex.transaction
            ) {
              logger.error(
                'Blockchain consistency broken - invalid transaction index.'
              );
              continue;
            }

            if (
              last.outputIdx !==
              transaction.prefix.outputs.length - 1 - outputIndex
            ) {
              logger.error(
                'Blockchain consistency broken - invalid output index.'
              );
              continue;
            }
            amountOutputs.pop();
            if (!amountOutputs.length) {
              this.outputs.delete(output.amount);
            }
          }
          break;
        case ETransactionIOType.SIGNATURE:
          {
            const amountOutputs = this.multiSignatureOutputs.get(output.amount);
            if (!amountOutputs.length) {
              logger.error(
                'Blockchain consistency broken - cannot find specific amount in outputs map.'
              );
              continue;
            }
            const last = amountOutputs[amountOutputs.length - 1];
            if (last.isUsed) {
              logger.error(
                'Blockchain consistency broken - attempting to remove used output.'
              );
              continue;
            }
            if (
              last.transactionIndex.block !== transactionIndex.block ||
              last.transactionIndex.transaction !== transactionIndex.transaction
            ) {
              logger.error(
                'Blockchain consistency broken - invalid transaction index.'
              );
              continue;
            }

            if (
              last.outputIndex !==
              transaction.prefix.outputs.length - 1 - outputIndex
            ) {
              logger.error(
                'Blockchain consistency broken - invalid output index.'
              );
              continue;
            }
            amountOutputs.pop();
            if (!amountOutputs.length) {
              this.multiSignatureOutputs.delete(output.amount);
            }
          }
          break;
      }
    }
    for (const input of transaction.prefix.inputs) {
      switch (input.tag) {
        case ETransactionIOType.KEY:
          {
            const inputKey = input.target as IInputKey;
            if (this.spendKeys.has(inputKey.keyImage)) {
              this.spendKeys.delete(inputKey.keyImage);
            }
          }
          break;
        case ETransactionIOType.SIGNATURE:
          {
            const inputSignature = input.target as IInputSignature;
            const amountOutputs = this.multiSignatureOutputs.get(
              inputSignature.amount
            );
            if (!amountOutputs[inputSignature.outputIndex].isUsed) {
              logger.error(
                'Blockchain consistency broken - multisignature output not marked as used.'
              );
            }
            amountOutputs[inputSignature.outputIndex].isUsed = false;
          }
          break;
      }
    }
    this.payment.remove(transaction);
    if (!this.transactionPairs.has(hash)) {
      logger.error(
        'Blockchain consistency broken - cannot find transaction by hash.'
      );
    }
    this.transactionPairs.delete(hash);
  }

  public loadTransaction(context: P2pConnectionContext, block: IBlock) {
    const transactions: ITransaction[] = [];

    for (let i = 0; i < block.transactionHashes.length; i++) {
      const hash = block.transactionHashes[i];
      const td = context.mempool.takeTx(hash);
      if (!td) {
        const tvc: ITxVerificationContext = {
          addedToPool: false,
          shouldBeRelayed: false,
          txFeeTooSmall: false,
          verifivationFailed: false,
          verifivationImpossible: false,
        };
        for (let j = 0; j < i; j++) {
          assert(
            context.mempool.addTx(context, transactions[i - 1 - j], tvc, true)
          );
        }
        return;
      }
      transactions.push(td.tx);
    }
    return transactions;
  }

  public pushBlock(
    context: P2pConnectionContext,
    block: IBlock,
    bvc: IBlockVerificationContext
  ) {
    const transactions = this.loadTransaction(context, block);

    if (!transactions) {
      bvc.verificationFailed = true;
      return false;
    }

    // if (!pushBlock(blockData, transactions, bvc)) {
    //   saveTransactions(transactions);
    //   return false;
    // }

    return true;
  }

  public pushBlockWithTransactions(
    context: P2pConnectionContext,
    transactions: ITransaction[],
    block: IBlock,
    bvc: IBlockVerificationContext
  ) {
    const start = unixNow();

    const hash = Block.hash(block);
    if (this.blockIndex.has(hash)) {
      logger.error(
        'Block ' + hash.toString('hex') + ' already exists in blockchain.'
      );
      bvc.verificationFailed = true;
      return false;
    }

    if (!block.header.preHash.equals(this.blockIndex.tail)) {
      logger.error(
        'Block ' +
          hash.toString('hex') +
          '  has wrong previousBlockHash: ' +
          block.header.preHash.toString('hex') +
          ', expected: ' +
          this.blockIndex.tail.toString('hex')
      );
      bvc.verificationFailed = true;
      return false;
    }

    if (!this.checkTimestamp(block)) {
      logger.error(
        'Block ' + hash + ' has invalid timestamp: ' + block.header.timestamp
      );
      bvc.verificationFailed = true;
      return false;
    }

    // std::lock_guard<decltype(m_blockchain_lock)> lk(m_blockchain_lock);

    // auto blockProcessingStart = std::chrono::steady_clock::now();

    // hash_t blockHash = Block::getHash(blockData);

    // auto targetTimeStart = std::chrono::steady_clock::now();
    // difficulty_t currentDifficulty = getDifficultyForNextBlock();
    // auto target_calculating_time = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - targetTimeStart).count();

    // if (!(currentDifficulty)) {
    //   logger(ERROR, BRIGHT_RED) << "!!!!!!!!! difficulty overhead !!!!!!!!!";
    //   return false;
    // }

    // auto longhashTimeStart = std::chrono::steady_clock::now();
    // hash_t proof_of_work = NULL_HASH;
    // if (m_checkpoints.isCheckpoint(getHeight())) {
    //   if (!m_checkpoints.check(getHeight(), blockHash)) {
    //     logger(ERROR, BRIGHT_RED) <<
    //       "CHECKPOINT VALIDATION FAILED";
    //     bvc.m_verifivation_failed = true;
    //     return false;
    //   }
    // } else {
    //   if (!Block::checkProofOfWork(blockData, currentDifficulty, proof_of_work)) {
    //     logger(INFO, BRIGHT_WHITE) <<
    //       "Block " << blockHash << ", has too weak proof of work: " << proof_of_work << ", expected difficulty: " << currentDifficulty;
    //     bvc.m_verifivation_failed = true;
    //     return false;
    //   }
    // }

    // auto longhash_calculating_time = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - longhashTimeStart).count();

    // if (!prevalidate_miner_transaction(blockData, static_cast<uint32_t>(m_blocks.size()))) {
    //   logger(INFO, BRIGHT_WHITE) <<
    //     "Block " << blockHash << " failed to pass prevalidation";
    //   bvc.m_verifivation_failed = true;
    //   return false;
    // }

    // hash_t minerTransactionHash = BinaryArray::objectHash(blockData.baseTransaction);

    // block_entry_t block;
    // block.bl = blockData;
    // block.transactions.resize(1);
    // block.transactions[0].tx = blockData.baseTransaction;
    // transaction_index_t transactionIndex = { static_cast<uint32_t>(m_blocks.size()), static_cast<uint16_t>(0) };
    // pushTransaction(block, minerTransactionHash, transactionIndex);

    // size_t coinbase_blob_size = BinaryArray::size(blockData.baseTransaction);
    // size_t cumulative_block_size = coinbase_blob_size;
    // uint64_t fee_summary = 0;
    // for (size_t i = 0; i < transactions.size(); ++i) {
    //   const hash_t& tx_id = blockData.transactionHashes[i];
    //   block.transactions.resize(block.transactions.size() + 1);
    //   size_t blob_size = 0;
    //   uint64_t fee = 0;
    //   block.transactions.back().tx = transactions[i];

    //   blob_size = BinaryArray::to(block.transactions.back().tx).size();
    //   fee = getInputAmount(block.transactions.back().tx) - getOutputAmount(block.transactions.back().tx);
    //   if (!checkTransactionInputs(block.transactions.back().tx)) {
    //     logger(INFO, BRIGHT_WHITE) <<
    //       "Block " << blockHash << " has at least one transaction with wrong inputs: " << tx_id;
    //     bvc.m_verifivation_failed = true;

    //     block.transactions.pop_back();
    //     popTransactions(block, minerTransactionHash);
    //     return false;
    //   }

    //   ++transactionIndex.transaction;
    //   pushTransaction(block, tx_id, transactionIndex);

    //   cumulative_block_size += blob_size;
    //   fee_summary += fee;
    // }

    // if (!checkCumulativeBlockSize(blockHash, cumulative_block_size, m_blocks.size())) {
    //   bvc.m_verifivation_failed = true;
    //   return false;
    // }

    // int64_t emissionChange = 0;
    // uint64_t reward = 0;
    // uint64_t already_generated_coins = m_blocks.empty() ? 0 : m_blocks.back().already_generated_coins;
    // if (!validate_miner_transaction(blockData, static_cast<uint32_t>(m_blocks.size()), cumulative_block_size, already_generated_coins, fee_summary, reward, emissionChange)) {
    //   logger(INFO, BRIGHT_WHITE) << "Block " << blockHash << " has invalid miner transaction";
    //   bvc.m_verifivation_failed = true;
    //   popTransactions(block, minerTransactionHash);
    //   return false;
    // }

    // block.height = static_cast<uint32_t>(m_blocks.size());
    // block.block_cumulative_size = cumulative_block_size;
    // block.cumulative_difficulty = currentDifficulty;
    // block.already_generated_coins = already_generated_coins + emissionChange;
    // if (m_blocks.size() > 0) {
    //   block.cumulative_difficulty += m_blocks.back().cumulative_difficulty;
    // }

    // pushBlock(block);

    // auto block_processing_time = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - blockProcessingStart).count();

    // logger(DEBUGGING) <<
    //   "+++++ BLOCK SUCCESSFULLY ADDED" << ENDL << "id:\t" << blockHash
    //   << ENDL << "PoW:\t" << proof_of_work
    //   << ENDL << "HEIGHT " << block.height << ", difficulty:\t" << currentDifficulty
    //   << ENDL << "block reward: " << m_currency.formatAmount(reward) << ", fee = " << m_currency.formatAmount(fee_summary)
    //   << ", coinbase_blob_size: " << coinbase_blob_size << ", cumulative size: " << cumulative_block_size
    //   << ", " << block_processing_time << "(" << target_calculating_time << "/" << longhash_calculating_time << ")ms";

    // bvc.m_added_to_main_chain = true;

    // update_next_comulative_size_limit();

    // return true;
  }

  public checkTimestamp(block: IBlock) {
    if (
      block.header.timestamp >
      this.getAdjustedTime() + parameters.CRYPTONOTE_BLOCK_FUTURE_TIME_LIMIT
    ) {
      logger.error(
        'Timestamp of block with id: ' +
          Block.hash(block).toString('hex') +
          ', ' +
          block.header.timestamp +
          ', bigger than adjusted time + 2 hours'
      );
      return false;
    }
    const timestamps = [];
    let offset =
      this.height <= parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW
        ? 0
        : this.height - parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW;
    for (; offset !== this.height; offset++) {
      timestamps.push(this.get(offset).block.header.timestamp);
    }
    return this.checkTimestamps(block, timestamps);
  }

  public checkTimestamps(block: IBlock, timestamps: uint64[]) {
    if (timestamps.length < parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW) {
      return true;
    }

    const median = medianValue(timestamps);
    if (block.header.timestamp < median) {
      logger.error(
        'Timestamp of block with id: ' +
          Block.hash(block) +
          ', ' +
          block.header.timestamp +
          ', less than median of last ' +
          parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW +
          ' blocks, ' +
          median
      );
      return false;
    }
    return true;
  }
  public getAdjustedTime(): uint64 {
    return unixNow();
  }
}
