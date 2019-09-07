import * as assert from 'assert';
import { EventEmitter } from 'events';
import { parameters } from '../../config';
import {
  BLOCK_HEIGHT_UPDATED,
  BLOCKCHAIN_SYNCHRONZIED,
  PEERS_COUNT_UPDATED,
} from '../../config/events';
import { CNFashHash, IHash } from '../../crypto/types';
import { Block } from '../../cryptonote/block/block';
import { BlockChain } from '../../cryptonote/block/blockchain';
import { MemoryPool } from '../../cryptonote/mem-pool';
import { ICoreSyncData } from '../../cryptonote/p2p';
import { NSNewBlock } from '../../cryptonote/protocol/commands/new-block';
import { NSNewTransactions } from '../../cryptonote/protocol/commands/new-transactions';
import { NSRequestChain } from '../../cryptonote/protocol/commands/request-chain';
import { NSRequestGetObjects } from '../../cryptonote/protocol/commands/request-get-objects';
import { NSRequestTXPool } from '../../cryptonote/protocol/commands/request-tx-pool';
import { NSResponseChain } from '../../cryptonote/protocol/commands/response-chain';
import { NSResponseGetObjects } from '../../cryptonote/protocol/commands/response-get-objects';
import { IBlockCompletEntry } from '../../cryptonote/protocol/defines';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { Transaction } from '../../cryptonote/transaction/index';
import { TransactionPrefix } from '../../cryptonote/transaction/prefix';
import { TransactionValidator } from '../../cryptonote/transaction/validator';
import { IBlock, ITransaction, uint32 } from '../../cryptonote/types';
import { logger } from '../../logger';
import { ConnectionState, P2pConnectionContext } from '../connection';
import { Command } from './command';

export class Handler extends EventEmitter {
  public peers: uint32 = 0;

  private blockchain: BlockChain;
  private memPool: MemoryPool;

  constructor(blockchain: BlockChain, memPool: MemoryPool) {
    super();
    this.blockchain = blockchain;
    this.memPool = memPool;
  }

  public getPayLoad(): ICoreSyncData {
    const height = this.blockchain.height;
    if (this.blockchain.empty()) {
      const genesis = this.blockchain.genesis();
      return {
        currentHeight: height,
        hash: genesis.hash,
      };
    } else {
      const be = this.blockchain.get(height - 1);
      const hash = BlockChain.hash(be.block);
      return {
        currentHeight: height,
        hash,
      };
    }
  }

  public processPayLoad(
    context: P2pConnectionContext,
    data: ICoreSyncData,
    isInitial: boolean
  ): boolean {
    if (context.state === ConnectionState.BEFORE_HANDSHAKE && !isInitial) {
      return false;
    }
    if (context.state !== ConnectionState.SYNCHRONIZING) {
      if (this.haveBlock(data.hash)) {
        if (isInitial) {
          this.emit(BLOCKCHAIN_SYNCHRONZIED); //
          context.state = ConnectionState.POOL_SYNC_REQUIRED;
        } else {
          context.state = ConnectionState.NORMAL;
        }
      } else {
        const diff = data.currentHeight - this.blockchain.height;
        context.state = ConnectionState.SYNC_REQURIED;
        if (diff > 0) {
          logger.info('New block height found: ' + data.currentHeight);
        } else {
          logger.info('Old block height found: ' + data.currentHeight);
        }
        logger.info('Current block height is: ' + this.blockchain.height);
        logger.info('Synchronization required!');
      }
    }
    return true;
  }

  public haveBlock(hash: Buffer) {
    return this.blockchain.have(hash);
  }

  get height() {
    return this.blockchain.height;
  }

  public notifyPeerCount(count: number) {
    this.emit(PEERS_COUNT_UPDATED, count);
  }

  public onCommand(
    cmd: Command,
    buffer: Buffer,
    context: P2pConnectionContext
  ) {
    logger.info('buffer size: ' + buffer.length);
    switch (cmd) {
      case Command.NOTIFY_NEW_BLOCK:
        logger.info('on Notify New Block');
        this.onNewBlock(buffer, context);
        break;
      case Command.NOTIFY_NEW_TRANSACTIONS:
        logger.info('on Notify New Transactions');
        this.onNewTransactions(buffer, context);
        break;
      case Command.NOTIFY_REQUEST_GET_OBJECTS:
        logger.info('on Notify Request Objects');
        this.onRequestObjects(buffer, context);
        break;
      case Command.NOTIFY_RESPONSE_GET_OBJECTS:
        logger.info('on Notify Response Objects');
        this.onResponseObjects(buffer, context);
        break;
      case Command.NOTIFY_REQUEST_CHAIN:
        logger.info('on Notify Request Chain');
        break;
      case Command.NOTIFY_RESPONSE_CHAIN_ENTRY:
        logger.info('on Notify Response Chain Entry');
        this.onResponseChain(buffer, context);
        break;
      case Command.NOTIFY_REQUEST_TX_POOL:
        logger.info('on Notify Request TX Pool');
        this.onRequestPool(buffer, context);
        break;
      default:
        logger.info('Unknown Command!');
    }
    return cmd;
  }

  public onIdle() {
    // TODO
  }

  public onNewBlock(buffer: Buffer, context: P2pConnectionContext) {
    const request: NSNewBlock.IRequest = NSNewBlock.Reader.request(
      new BufferStreamReader(buffer)
    );
    logger.info('-->>NOTIFY_NEW_BLOCK<<--');
    logger.info('hop : ' + request.hop);
    this.emit(BLOCK_HEIGHT_UPDATED, request.currentBlockHeight, context);
    context.remoteBlockchainHeight = request.currentBlockHeight;
    if (context.state !== ConnectionState.NORMAL) {
      return false;
    }
    if (request.blockCompleteEntry.txs) {
      for (const tx of request.blockCompleteEntry.txs) {
      }
    }
    return true;
  }
  public onNewTransactions(buffer: Buffer, context: P2pConnectionContext) {
    if (context.state !== ConnectionState.NORMAL) {
      return false;
    }
    const request = NSNewTransactions.Reader.request(
      new BufferStreamReader(buffer)
    );
    logger.info('-->>NOTIFY_NEW_TRANSACTIONS<<--');
    if (request.txs) {
      for (const tx of request.txs) {
        if (!this.handIncomingTx(tx)) {
        }
      }
    }
  }

  public handIncomingTx(txBuffer: Buffer, keptByBlock: boolean = false) {
    if (txBuffer.length > parameters.CRYPTONOTE_MAX_TX_SIZE) {
      logger.error('WRONG TRANSACTION BLOB, too big size: ' + txBuffer.length);
      return false;
    }
    try {
      const transaction: ITransaction = Transaction.read(
        new BufferStreamReader(txBuffer)
      );
      const hash = Transaction.hash(transaction);
      const directHash = CNFashHash(txBuffer);
      assert(hash.equals(directHash));
      const prefixHash = TransactionPrefix.hash(transaction.prefix);

      if (!TransactionValidator.checkSematic(transaction)) {
        logger.error(
          'WRONG TRANSACTION BLOB, Failed to check tx ' +
            hash +
            ' semantic, rejected!'
        );
        return false;
      }
      return this.handNewTransaction(transaction, hash, txBuffer);
    } catch (e) {
      logger.error('WRONG TRANSACTION BLOB, Failed to parse, rejected!');
      return false;
    }
  }

  public handNewTransaction(
    transaction: ITransaction,
    txHash: IHash,
    txBuffer: Buffer
  ) {}

  public addNewTransaction(
    transaction: ITransaction,
    txHash: IHash,
    txBuffer: Buffer
  ) {
    if (this.blockchain.haveTransaction(txHash)) {
      logger.info('tx ' + txHash + ' is already in blockchain');
      return true;
    }
    if (this.memPool.haveTx(txHash)) {
      logger.info('tx ' + txHash + ' is already in transaction pool');
      return true;
    }
    return this.memPool.addTx(transaction, txBuffer, false);
  }

  public onRequestObjects(buffer: Buffer, context: P2pConnectionContext) {
    const request = NSRequestGetObjects.Reader.request(
      new BufferStreamReader(buffer)
    );
    logger.info('-->>NOTIFY_REQUEST_GET_OBJECTS<<--');
    const currentHeight = this.blockchain.height;
    const missed = [];
    const blocks: IBlock[] = [];
    if (request.blocks) {
      for (const block of request.blocks) {
        const height = this.blockchain.getHeightByHash(block);
        if (!height) {
          missed.push(block);
          continue;
        }
        blocks.push(this.blockchain.get(height.block).block);
      }
    }

    const blockCompleteEntries = [];
    const missedTxs = [];

    for (const block of blocks) {
      const be: IBlockCompletEntry = {
        block: Block.toBuffer(block),
      };
      const txs = this.blockchain.getTransactionsWithMissed(
        block.transactionHashes,
        missedTxs
      );
      be.txs = this.marshallTx(txs);
      blockCompleteEntries.push(block);
    }
    const outTxs = this.blockchain.getTransactionsWithMissed(
      request.txs,
      missedTxs
    );
    const resTxs = this.marshallTx(outTxs);
    const response: NSResponseGetObjects.IRequest = {
      blocks: blockCompleteEntries,
      currentBlockchainHeight: currentHeight,
      missedHashes: missedTxs,
      txs: resTxs,
    };
    const writer = new BufferStreamWriter();
    NSResponseGetObjects.Writer.request(writer, response);
    context.socket.write(writer.getBuffer());
  }

  public marshallTx(txs: ITransaction[]): Buffer[] {
    if (txs) {
      const res: Buffer[] = [];
      for (const tx of txs) {
        res.push(Transaction.toBuffer(tx));
      }
      return res;
    }
  }

  public onResponseObjects(buffer: Buffer, context: P2pConnectionContext) {
    const response = NSResponseGetObjects.Reader.request(
      new BufferStreamReader(buffer)
    );
    logger.info('-->>NOTIFY_RESPONSE_GET_OBJECTS<<--');
    if (context.lastResponseHeight > response.currentBlockchainHeight) {
      logger.error('received wrong OBJECTS!');
      logger.error(
        'received current blockchain height: ' +
          response.currentBlockchainHeight
      );
      logger.error(
        'recorded last response height: ' + context.lastResponseHeight
      );
      logger.error('dropping connection');
      context.state = ConnectionState.SHUTDOWN;
      return false;
    }
    this.emit(BLOCK_HEIGHT_UPDATED, response.currentBlockchainHeight, context);
    context.remoteBlockchainHeight = response.currentBlockchainHeight;
    if (response.blocks) {
      for (const be of response.blocks) {
        try {
          const block: IBlock = Block.readBlock(
            new BufferStreamReader(be.block)
          );
          const hash = Block.hash(block);
          if (block.transactionHashes.length) {
            assert(block.transactionHashes.length === be.txs.length);
          }
        } catch (e) {
          logger.error(e);
          logger.error('recevied wrong block!');
          logger.error(
            'failed to parse and validate block: ' + be.block.toString('hex')
          );
          logger.error('dropping connection');
          context.state = ConnectionState.SHUTDOWN;
          return false;
        }
      }
      if (!this.processObjects(response.blocks, context)) {
        return false;
      }
      return true;
    }
  }

  public onRequestChain() {}

  public onResponseChain(buffer: Buffer, context: P2pConnectionContext) {
    const request: NSResponseChain.IRequest = NSResponseChain.Reader.request(
      new BufferStreamReader(buffer)
    );
    logger.info('NOTIFY_RESPONSE_CHAIN_ENTRY : ');
    logger.info('block size : ' + request.blockHashes.length);
    logger.info('start height : ' + request.startHeight);
    logger.info('total height : ' + request.totalHeight);

    if (!request.blockHashes.length) {
      logger.info('recevied empty block ids, dropping connection');
      context.state = ConnectionState.SHUTDOWN;
      return false;
    }

    if (!this.blockchain.have(request.blockHashes[0])) {
      logger.info(
        'received block ids starting from unknown id: ' +
          request.blockHashes[0].toString('hex')
      );
      logger.info('dropping connection');
      context.state = ConnectionState.SHUTDOWN;
      return false;
    }
    context.remoteBlockchainHeight = request.totalHeight;
    context.lastResponseHeight =
      request.startHeight + request.blockHashes.length;
    if (context.lastResponseHeight > context.remoteBlockchainHeight) {
      logger.info('sent wrong NOTIFY_RESPONSE_CHAIN_ENTRY');
      logger.info('total height : ' + request.blockHashes.length);
      logger.info('block ids size: ' + request.blockHashes.length);
      logger.info('block ids size: ' + request.blockHashes.length);
      context.state = ConnectionState.SHUTDOWN;
      return false;
    }
    const missed = [];

    for (const block of request.blockHashes) {
      if (!this.blockchain.have(block)) {
        missed.push(block);
      }
    }

    logger.info('missed generated!');

    return this.requestMissingObjects(missed, context);
  }

  public onRequestPool(buffer: Buffer, context: P2pConnectionContext) {
    const request: NSRequestTXPool.IRequest = NSRequestTXPool.Reader.request(
      new BufferStreamReader(buffer)
    );
    logger.info('-->>NOTIFY_REQUEST_TX_POOL<<--');

    if (request.txs) {
      logger.info(' txs size: ' + request.txs.length);

      // TODO: add process when txs are not empty
    }
  }

  public startSync(context: P2pConnectionContext) {
    if (context.state === ConnectionState.SYNCHRONIZING) {
      const blocks = this.blockchain.buildSparseChain();
      assert(blocks.length);
      const request: NSRequestChain.IRequest = {
        blockHashes: blocks,
      };
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      NSRequestChain.Writer.request(writer, request);
      logger.info('-->>NOTIFY_REQUEST_CHAIN<<--');
      logger.info('size ' + request.blockHashes.length);
      context.socket.write(writer.getBuffer());
    }
  }

  // Requests
  public requestMissingObjects(blocks: IHash[], context: P2pConnectionContext) {
    logger.info('requesting missing objects');
    if (blocks.length) {
      const request: NSRequestGetObjects.IRequest = {
        blocks,
      };
      logger.info('-->>NOTIFY_REQUEST_GET_OBJECTS<<--');
      logger.info('blocks size: ' + blocks.length);
      logger.info('txs size: 0');
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      NSRequestGetObjects.Writer.request(writer, request);
      context.socket.write(writer.getBuffer());
      return true;
    }
    if (context.lastResponseHeight < context.remoteBlockchainHeight - 1) {
      this.sendRequestChain(context);
      return true;
    }

    if (!(context.lastResponseHeight === context.remoteBlockchainHeight - 1)) {
      logger.error(
        'Fail to request empty blocks with connection: [' + context + ']'
      );
      return false;
    }

    this.requestMissingPoolTransactions(context);

    context.state = ConnectionState.NORMAL;

    logger.info('Synchronized! State OK.');

    this.emit(BLOCKCHAIN_SYNCHRONZIED);

    return true;
  }

  public requestMissingPoolTransactions(context: P2pConnectionContext) {
    // assert(context.version >= )
    const transactions = this.memPool.getTransactions();
    const txs = [];
    for (const tx of transactions) {
      txs.push(Transaction.hash(tx));
    }
    const request: NSRequestTXPool.IRequest = {
      txs,
    };
    const writer = new BufferStreamWriter();
    NSRequestTXPool.Writer.request(writer, request);
    context.socket.write(writer.getBuffer());
  }

  public sendRequestChain(context: P2pConnectionContext) {
    const blockHashes = this.blockchain.buildSparseChain();
    const request: NSRequestChain.IRequest = {
      blockHashes,
    };
    const writer = new BufferStreamWriter();
    NSRequestChain.Writer.request(writer, request);
    context.socket.write(writer.getBuffer());
  }

  public processObjects(
    blockEntries: IBlockCompletEntry[],
    context: P2pConnectionContext
  ) {
    for (const block of blockEntries) {
      if (block.txs) {
        for (const txBuffer of block.txs) {
          assert(txBuffer.length <= parameters.CRYPTONOTE_MAX_TX_SIZE);
          try {
            const tx = Transaction.read(new BufferStreamReader(txBuffer));
            const txHash = Transaction.hash(tx);
            if (this.blockchain.haveTransaction(txHash)) {
              logger.info(
                'tx ' + txHash.toString('hex') + ' is already in blockchain!'
              );
              continue;
            }
            if (this.memPool.haveTx(txHash)) {
              logger.info(
                'tx ' +
                  txHash.toString('hex') +
                  ' is already in transaction pool!'
              );
              continue;
            }
            // this.memPool.addTx(tx);
          } catch (e) {
            logger.error(e);
            logger.error('Transaction parsing failed!');
            logger.error('tx id: ' + CNFashHash(txBuffer));
            logger.info('dropping connection');
            context.state = ConnectionState.SHUTDOWN;
            return false;
          }
        }
      }
    }
    return true;
  }
}
