export enum EBlockchainMessage {
  NEW_BLOCK_MESSAGE,
  NEW_ALTERNATIVE_BLOCK_MESSAGE,
  CHAIN_SWITCH_MESSAGE,
}

export class BlockchainMessage {
  private type: EBlockchainMessage;
  constructor(type: EBlockchainMessage) {
    this.type = type;
  }
  public send() {
    // TODO
  }
}
