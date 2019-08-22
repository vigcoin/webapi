import { IHash } from '../../crypto/types';
import { ITransaction } from '../types';
export class Payment {
  private index: Map<IHash, IHash>;
  // constructor() {}
  // public add(tx: ITransaction) {}
  // public remove(tx: ITransaction) {}

  // public find(paymentId: IHash): IHash[] {}

  public clear() {
    this.index.clear();
  }
}
