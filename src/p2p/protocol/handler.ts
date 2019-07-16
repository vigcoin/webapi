import { EventEmitter } from 'events';
import {
  BLOCK_HIEGHT_UPDATED,
  BLOCKCHAIN_SYNCHRONZIED,
} from '../../config/events';
import { BlockChain } from '../../cryptonote/block/blockchain';
import { ICoreSyncData } from '../../cryptonote/p2p';
import { uint32 } from '../../cryptonote/types';
import { logger } from '../../logger';
import { ConnectionState, P2pConnectionContext } from '../connection';
import { Command } from './command';
import { PEERS_COUNT_UPDATED } from '../../config/events';

export class Handler extends EventEmitter {
  public peers: uint32 = 0;
  public observedHeight: uint32 = 0;

  private blockchain: BlockChain;
  // tslint:disable-next-line:variable-name

  constructor(blockchain: BlockChain) {
    super();
    this.blockchain = blockchain;
    this.observedHeight = 0;
  }

  public getPayLoad(): ICoreSyncData {
    const height = this.blockchain.height;
    const be = this.blockchain.get(height);
    const hash = BlockChain.hash(be.block);
    return {
      currentHeight: height,
      hash,
    };
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
      this.emit(BLOCK_HIEGHT_UPDATED, this.observedHeight);
    }
  }

  public notifyPeerCount(count: number) {
    this.emit(PEERS_COUNT_UPDATED, count);
  }

  public onCommand(cmd: Command) {
    switch (cmd) {
      case Command.NOTIFY_NEW_BLOCK:
        this.onNewBlock();
        break;
      case Command.NOTIFY_NEW_TRANSACTIONS:
        this.onNewTransactions();
        break;
      case Command.NOTIFY_REQUEST_GET_OBJECTS:
      case Command.NOTIFY_RESPONSE_GET_OBJECTS:
      case Command.NOTIFY_REQUEST_CHAIN:
      case Command.NOTIFY_RESPONSE_CHAIN_ENTRY:
      case Command.NOTIFY_REQUEST_TX_POOL:
        break;
      default:
        break;
    }
  }

  public onNewBlock() {}
  public onNewTransactions() {}

  public onRequestObjects() {}

  public onResponseObjects() {}

  public onRequestChain() {}

  public onResponseChain() {}

  public onRequestPool() {}
}
