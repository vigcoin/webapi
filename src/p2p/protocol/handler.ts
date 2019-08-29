import * as assert from 'assert';
import { EventEmitter } from 'events';
import {
  BLOCK_HEIGHT_UPDATED,
  BLOCKCHAIN_SYNCHRONZIED,
  PEERS_COUNT_UPDATED,
} from '../../config/events';
import { IHash } from '../../crypto/types';
import { Block } from '../../cryptonote/block/block';
import { BlockChain } from '../../cryptonote/block/blockchain';
import { MemoryPool } from '../../cryptonote/mem-pool';
import { ICoreSyncData } from '../../cryptonote/p2p';
import { NSNewBlock } from '../../cryptonote/protocol/commands/new-block';
import { NSRequestChain } from '../../cryptonote/protocol/commands/request-chain';
import { NSRequestGetObjects } from '../../cryptonote/protocol/commands/request-get-objects';
import { NSRequestTXPool } from '../../cryptonote/protocol/commands/request-tx-pool';
import { NSResponseChain } from '../../cryptonote/protocol/commands/response-chain';
import { NSResponseGetObjects } from '../../cryptonote/protocol/commands/response-get-objects';
import { IBlockCompletEntry } from '../../cryptonote/protocol/defines';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { IBlock, uint32 } from '../../cryptonote/types';
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
    switch (cmd) {
      case Command.NOTIFY_NEW_BLOCK:
        logger.info('on Notify New Block');
        this.onNewBlock(buffer, context);
        break;
      case Command.NOTIFY_NEW_TRANSACTIONS:
        logger.info('on Notify New Transactions');
        this.onNewTransactions();
        break;
      case Command.NOTIFY_REQUEST_GET_OBJECTS:
        logger.info('on Notify Request Objects');
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
    console.log(request);

    logger.info('-->>NOTIFY_NEW_BLOCK<<--');
    logger.info('hop : ' + request.hop);
    this.emit(BLOCK_HEIGHT_UPDATED, request.currentBlockHeight, context);
    context.remoteBlockchainHeight = request.currentBlockHeight;
    if (context.state !== ConnectionState.NORMAL) {
      return;
    }
    if (request.blockCompleteEntry.txs) {
      for (const tx of request.blockCompleteEntry.txs) {
      }
    }
  }
  public onNewTransactions() {}

  public onRequestObjects() {}

  public onResponseObjects(buffer: Buffer, context: P2pConnectionContext) {
    const response = NSResponseGetObjects.Reader.request(
      new BufferStreamReader(buffer)
    );
    console.log(response);

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
      return;
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

          if (block.transactionHashes.length !== be.txs.length) {
            logger.info('-->>NOTIFY_RESPONSE_GET_OBJECTS<<--');
            logger.info('block ids mismatch with block complete entries!');
            logger.error('dropping connection');
            context.state = ConnectionState.SHUTDOWN;
            return;
          }
        } catch (e) {
          logger.error('recevied wrong block!');
          logger.error(
            'failed to parse and validate block: ' + be.block.toString('hex')
          );
          logger.error('dropping connection');
          context.state = ConnectionState.SHUTDOWN;
          return;
        }
      }
      if (!this.processObjects(response.blocks, context)) {
        return;
      }
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
      return;
    }
    if (!this.blockchain.have(request.blockHashes[0])) {
      logger.info(
        'received block ids starting from unknown id: ' + request.blockHashes[0]
      );
      logger.info('dropping connection');
      context.state = ConnectionState.SHUTDOWN;
      return;
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
    }

    const missed = [];

    for (const block of request.blockHashes) {
      if (!this.blockchain.have(block)) {
        missed.push(block);
      }
    }

    this.requestMissingObjects(missed, context);
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
    }
  }

  public processObjects(
    blockEntries: IBlockCompletEntry[],
    context: P2pConnectionContext
  ) {
    for (const block of blockEntries) {
      // for (const txBuffer of block.txs) {
      //   assert(txBuffer.length <= parameters.CRYPTONOTE_MAX_TX_SIZE);
      //   try {
      //     // const tx = Transaction.read(new BufferStreamReader(txBuffer));
      //     // const txHash = Transaction.hash(tx);
      //     // if (this.blockchain.haveTransaction(txHash)) {
      //     //   logger.info(
      //     //     'tx ' + txHash.toString('hex') + ' is already in blockchain!'
      //     //   );
      //     //   continue;
      //     // }
      //     // if (this.memPool.haveTx(txHash)) {
      //     //   logger.info(
      //     //     'tx ' +
      //     //       txHash.toString('hex') +
      //     //       ' is already in transaction pool!'
      //     //   );
      //     //   continue;
      //     // }
      //     // this.memPool.addTx(tx);
      //   } catch (e) {
      //     logger.error(e);
      //     logger.error('Transaction parsing failed!');
      //     logger.error('tx id: ' + CNFashHash(txBuffer));
      //     logger.info('dropping connection');
      //     context.state = ConnectionState.SHUTDOWN;
      //     return false;
      //   }
      // }
    }
    return true;
  }
}
