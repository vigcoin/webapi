import { HASH_LENGTH, IPublicKey } from '@vigcoin/crypto';
import { BufferStreamReader } from '@vigcoin/serializer';
import { ITransaction, usize } from '@vigcoin/types';
import * as assert from 'assert';

export const TX_EXTRA_PADDING_MAX_COUNT = 255;
export const TX_EXTRA_NONCE_MAX_COUNT = 255;
export const TX_EXTRA_TAG_PADDING = 0x00;
export const TX_EXTRA_TAG_PUBKEY = 0x01;
export const TX_EXTRA_NONCE = 0x02;

export const TX_EXTRA_NONCE_PAYMENT_ID = 0x00;

export interface ITransactionExtraPadding {
  size: usize;
}

export interface ITransactionExtraPublicKey {
  publicKey: IPublicKey;
}

export interface ITransactionExtraNonce {
  nonce: Buffer;
}

export type ITransactionExtra =
  | ITransactionExtraNonce
  | ITransactionExtraPublicKey
  | ITransactionExtraPadding;

export class TransactionExtra {
  public static parse(extra: Buffer): ITransactionExtra[] {
    const reader = new BufferStreamReader(extra);
    const parsed: ITransactionExtra[] = [];
    let size = 0;
    while (reader.getRemainedSize() > 0) {
      const tag = reader.readUInt8();
      switch (tag) {
        case TX_EXTRA_TAG_PADDING:
          size = 1;
          for (; size <= TX_EXTRA_PADDING_MAX_COUNT; size++) {
            if (reader.getRemainedSize() > 0) {
              const pad = reader.readUInt8();
              assert(pad === 0);
            } else {
              break;
            }
          }
          parsed.push({
            size,
          });
          break;
        case TX_EXTRA_TAG_PUBKEY:
          const publicKey: IPublicKey = reader.readHash();
          parsed.push({
            publicKey,
          });
          break;
        case TX_EXTRA_NONCE:
          size = reader.readUInt8();
          let nonce = Buffer.alloc(0);
          if (size > 0) {
            nonce = reader.read(size);
          }
          parsed.push({
            nonce,
          });
          break;
        default:
          throw new Error('Wrong tag!');
      }
    }
    return parsed;
  }

  public static getNonce(buffer: Buffer): Buffer {
    const extras = TransactionExtra.parse(buffer);
    let nonce = null;
    for (const extra of extras) {
      const temp = extra as ITransactionExtraNonce;
      if (temp.nonce && temp.nonce.length) {
        nonce = temp;
        break;
      }
    }
    return nonce;
  }

  public static getPaymentId(tx: ITransaction): Buffer {
    const nonce = TransactionExtra.getNonce(tx.prefix.extra);
    if (!nonce) {
      return;
    }
    if (nonce.length !== HASH_LENGTH + 1) {
      return;
    }
    if (TX_EXTRA_NONCE_PAYMENT_ID !== nonce[0]) {
      return;
    }
    return nonce.slice(1);
  }
}
