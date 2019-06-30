import { BlockChain } from '../../cryptonote/block/blockchain';
import { ICoreSyncData } from '../../cryptonote/p2p';
import { ConnectionState, P2pConnectionContext } from '../connection';
import { Command } from './command';

export class Handler {
  private blockchain: BlockChain;
  constructor(blockchain: BlockChain) {
    this.blockchain = blockchain;
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
    data: ICoreSyncData,
    context: P2pConnectionContext,
    initial: boolean
  ): boolean {
    if (context.state === ConnectionState.BEFORE_HANDSHAKE && !initial) {
      return true;
    }

    if (context.state !== ConnectionState.SYNCHRONIZING) {
      // if(this.blockchain.have(data.hash)) {
      // }
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
