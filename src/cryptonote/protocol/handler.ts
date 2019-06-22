import { Currency } from '../currency';
import { Command } from './command';

export class Handler {
  private currency: Currency;
  constructor(currency: Currency) {
    this.currency = currency;
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
