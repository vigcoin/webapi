import { IHash } from '@vigcoin/crypto';
import { ITransaction } from '@vigcoin/types';
import { MultiMap } from '../../util/map';
import { TransactionExtra } from '../transaction/extra';
import { Transaction } from '../transaction/index';

export class Payment {
  private map: MultiMap<IHash, IHash> = new MultiMap();
  public toPayment(tx: ITransaction) {
    const hash = Transaction.hash(tx);
    const paymentId = TransactionExtra.getPaymentId(tx);
    return {
      hash,
      paymentId,
    };
  }
  public add(tx: ITransaction) {
    const { hash, paymentId } = this.toPayment(tx);
    if (paymentId) {
      this.map.set(paymentId, hash);
    }
  }
  public remove(tx: ITransaction) {
    const { hash, paymentId } = this.toPayment(tx);
    if (paymentId) {
      this.map.remove(paymentId, item => {
        return !item.equals(hash);
      });
    }
  }

  // public find(paymentId: IHash, hash: IHash): IHash {
  //   const hashes = this.map.get(paymentId);
  //   if(hashes.indexOf(hash) !== -1) {

  //   }
  // }

  public clear() {
    this.map.clear();
  }
}
