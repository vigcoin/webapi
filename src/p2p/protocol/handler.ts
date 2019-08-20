import * as assert from 'assert';
import { EventEmitter } from 'events';
import {
  BLOCK_HEIGHT_UPDATED,
  BLOCKCHAIN_SYNCHRONZIED,
  PEERS_COUNT_UPDATED,
} from '../../config/events';
import { BlockChain } from '../../cryptonote/block/blockchain';
import { ICoreSyncData } from '../../cryptonote/p2p';
import { NSNewBlock } from '../../cryptonote/protocol/commands/new-block';
import { NSRequestChain } from '../../cryptonote/protocol/commands/request-chain';
import { NSRequestTXPool } from '../../cryptonote/protocol/commands/request-tx-pool';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { uint32 } from '../../cryptonote/types';
import { logger } from '../../logger';
import { ConnectionState, P2pConnectionContext } from '../connection';
import { Command } from './command';

export class Handler extends EventEmitter {
  public peers: uint32 = 0;
  public observedHeight: uint32 = 0;

  private blockchain: BlockChain;

  constructor(blockchain: BlockChain) {
    super();
    this.blockchain = blockchain;
    this.observedHeight = 0;
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

  public notifyNewHeight(current: number) {
    if (this.observedHeight < current) {
      this.observedHeight = current;
      this.emit(BLOCK_HEIGHT_UPDATED, this.observedHeight);
    }
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
        const request: NSNewBlock.IRequest = NSNewBlock.Reader.request(
          new BufferStreamReader(buffer)
        );
        this.onNewBlock(request, context);
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

        break;
      case Command.NOTIFY_REQUEST_CHAIN:
        logger.info('on Notify Request Chain');
        break;
      case Command.NOTIFY_RESPONSE_CHAIN_ENTRY:
        logger.info('on Notify Response Chain Entry');
        break;
      case Command.NOTIFY_REQUEST_TX_POOL:
        logger.info('on Notify Request TX Pool');
        this.onRequestPool(buffer, context);
        break;
      default:
        logger.info('Unknown Command!');
        break;
    }
  }

  public onIdle() {
    // TODO
  }

  public onNewBlock(
    request: NSNewBlock.IRequest,
    context: P2pConnectionContext
  ) {
    logger.info('NOTIFY_NEW_BLOCK (hop ' + request.hop + ')');
  }
  public onNewTransactions() {}

  public onRequestObjects() {}

  public onResponseObjects() {}

  public onRequestChain() {}

  public onResponseChain() {}

  public onRequestPool(buffer: Buffer, context: P2pConnectionContext) {
    const request: NSRequestTXPool.IRequest = NSRequestTXPool.Reader.request(
      new BufferStreamReader(buffer)
    );
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
      logger.info(
        '-->>NOTIFY_REQUEST_CHAIN: size ' + request.blockHashes.length
      );
      context.socket.write(writer.getBuffer());
    }
  }
}
