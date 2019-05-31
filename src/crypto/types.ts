import * as assert from 'assert';
import { type } from 'os';

export const HASH_LENGTH = 32;
export const SIGNATURE_LENGTH = 64;
export const NULL_HASH: Buffer = new Buffer(HASH_LENGTH);

export class BaseBuffer {
  public static getBuffer(length = HASH_LENGTH) {
    return new BaseBuffer(new Buffer(HASH_LENGTH));
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

export type Hash = Buffer;
export type Key = Hash;
export type PublicKey = Hash;
export type PrivateKey = Hash;
export type KeyDerivation = Hash;
export type KeyImage = Hash;
export type Signature = Hash;
