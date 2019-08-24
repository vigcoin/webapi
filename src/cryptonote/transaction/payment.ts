import { Hash } from '../../crypto/hash';
import { IHash } from '../../crypto/types';
import { MultiMap } from '../../util/map';
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import { ITransaction } from '../types';
import { ITransactionExtraNonce, TransactionExtra } from './extra';
import { Transaction } from './index';

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
