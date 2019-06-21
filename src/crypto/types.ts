import * as assert from 'assert';
import { type } from 'os';

export const HASH_LENGTH = 32;
export const SIGNATURE_LENGTH = 64;
export const NULL_HASH: Buffer = Buffer.alloc(HASH_LENGTH);

export class BaseBuffer {
  public static getBuffer(length = HASH_LENGTH) {
    return new BaseBuffer(Buffer.alloc(HASH_LENGTH));
  }
  private data: Buffer;

  constructor(data: Buffer, length = HASH_LENGTH) {
    assert(data);
    assert(data.length === length);
    this.data = data;
  }

  public get(): Buffer {
    return this.data;
  }
}

export type Hash = Buffer; // uint8[32]
export type Key = Hash;
export type PublicKey = Hash;
export type PrivateKey = Hash;
export type KeyDerivation = Hash;
export type KeyImage = Hash;
export type Signature = Hash;
