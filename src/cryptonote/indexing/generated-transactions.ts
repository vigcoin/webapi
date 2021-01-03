import {
  ETransactionIOType,
  IBlock,
  IInputBase,
  uint32,
  uint64,
} from '@vigcoin/types';
import * as assert from 'assert';

export class GeneratedTransaction {
  private lastGeneratedTxNumber: uint64 = 0;
  private index: Map<uint32, uint64> = new Map();

  public getInput(block: IBlock): IInputBase {
    assert(block.transaction.prefix.inputs.length);

    const front = block.transaction.prefix.inputs[0];
    assert(front.tag === ETransactionIOType.BASE);

    return front.target as IInputBase;
  }

  public add(block: IBlock): boolean {
    const input = this.getInput(block);
    const height = input.blockIndex;
    if (this.index.size !== height) {
      return false;
    }

    if (this.index.has(height)) {
      return false;
    }

    this.index.set(
      height,
      this.lastGeneratedTxNumber + block.transactionHashes.length + 1
    );
    this.lastGeneratedTxNumber += block.transactionHashes.length + 1;
    return true;
  }

  public remove(block: IBlock): boolean {
    const input = this.getInput(block);
    const height = input.blockIndex;
    if (this.index.size !== height) {
      return false;
    }

    assert(this.index.has(height));
    this.index.delete(height);
    if (height !== 0) {
      assert(this.index.has(height - 1));

      this.lastGeneratedTxNumber = this.index.get(height - 1);
    } else {
      this.lastGeneratedTxNumber = 0;
    }

    return true;
  }

  public clear() {
    this.index.clear();
  }

  public find(height: uint64) {
    return this.index.has(height);
  }
}
