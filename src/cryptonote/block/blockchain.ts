import * as assert from 'assert';
import { Configuration } from '../../config/types';
import { IHash, IKeyImage } from '../../crypto/types';
import { logger } from '../../logger';
import { MultiMap } from '../../util/map';
import { Transaction } from '../transaction/index';
import {
  ETransactionIOType,
  IBlock,
  IBlockEntry,
  IInputKey,
  IInputSignature,
  ITransactionIndex,
  ITransactionMultisignatureOutputUsage,
  uint16,
  uint64,
} from '../types';
import { Block } from './block';
import { BlockIndex } from './block-index';

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

  private files: Configuration.IBlockFile;
  private currency: Configuration.ICurrency;
  private blockIndex: BlockIndex;
  private block: Block;
  private offsets: uint64[];

  // caches
  private blockHashes: Set<IHash> = new Set();
  private transactionPairs: Map<IHash, ITransactionIndex> = new Map();
  private spendKeys: Set<IKeyImage> = new Set();
  private outputs: MultiMap<
    uint64,
    Map<ITransactionIndex, uint16>
  > = new MultiMap();
  private multiSignatureOutputs: MultiMap<
    uint64,
    ITransactionMultisignatureOutputUsage
  > = new MultiMap();

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
              const map = new Map<ITransactionIndex, uint16>();
              map.set(ti, count);
              this.outputs.set(output.amount, map);
              break;
            case ETransactionIOType.SIGNATURE:
              const usage: ITransactionMultisignatureOutputUsage = {
                isUsed: false,
                outputIndex: count,
                transactionIndex: ti,
              };
              this.multiSignatureOutputs.set(output.amount, usage);
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

  public have(hash: IHash): IBlockEntry {
    for (let i = this.height - 1; i > 0; i--) {
      const be = this.get(i);
      if (be.block.header.preHash.equals(hash)) {
        logger.info('hash found, index: ', i - 1);
        return this.get(i - 1);
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
}
