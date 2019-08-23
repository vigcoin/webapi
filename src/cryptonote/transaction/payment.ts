import { Hash } from '../../crypto/hash';
import { IHash } from '../../crypto/types';
import { MultiMap } from '../../util/map';
import { BufferStreamReader } from '../serialize/reader';
import { BufferStreamWriter } from '../serialize/writer';
import { ITransaction } from '../types';
import { ITransactionExtraNonce, TransactionExtra } from './extra';
import { Transaction } from './index';

export class Payment {
  private index: MultiMap<IHash, IHash>;
  // constructor() {}
  public add(tx: ITransaction) {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, tx);
    const buffer = writer.getBuffer();
    const hash = Hash.from(buffer);
    const extras = TransactionExtra.parse(tx.prefix.extra);
    let nonce = null;
    for (const extra of extras) {
      const temp = extra as ITransactionExtraNonce;
      if (temp.nonce && temp.nonce.length) {
        nonce = temp;
        break;
      }
    }
    if (!nonce) {
      return;
    }
    // const paymentId =
  }
  public remove(tx: ITransaction) {}

  // public find(paymentId: IHash): IHash[] {}

  public clear() {
    this.index.clear();
  }
}
