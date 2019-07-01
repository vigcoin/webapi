import { EventEmitter } from 'events';
import { BlockChain } from '../../cryptonote/block/blockchain';
import { ICoreSyncData } from '../../cryptonote/p2p';
import { uint32 } from '../../cryptonote/types';
import { P2pConnectionContext } from '../connection';
import { Command } from './command';

export class Handler extends EventEmitter {
  public peers: uint32 = 0;

  private blockchain: BlockChain;
  // tslint:disable-next-line:variable-name
  private observedHeight: uint32 = 0;

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

  public haveBlock(hash: Buffer) {
    return this.blockchain.have(hash);
  }

  get height() {
    return this.blockchain.height;
  }

  public updateObserverHeight(current, context: P2pConnectionContext) {
    const height = this.observedHeight;
    if (current > context.remoteBlockchainHeight && current > height) {
      this.observedHeight = current;
      this.emit('block-height-updated', this.observedHeight);
    }
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
