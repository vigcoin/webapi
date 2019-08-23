import { IPublicKey } from '../../crypto/types';
import { BufferStreamReader } from '../serialize/reader';
import { usize } from '../types';

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

    while (reader.getRemainedSize() > 0) {
      const tag = reader.readUInt8();
      switch (tag) {
        case TX_EXTRA_TAG_PADDING:
          break;
        case TX_EXTRA_TAG_PUBKEY:
          const publicKey: IPublicKey = reader.readHash();
          parsed.push({
            publicKey,
          });
          break;
        case TX_EXTRA_NONCE:
          break;
      }
    }
    return parsed;
  }
}
