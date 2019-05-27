import * as assert from "assert";

export const HASH_LENGTH = 32;
export const NULL_HASH: Buffer = new Buffer(HASH_LENGTH);

export class Hash {
  private data: Buffer;

  constructor(data: Buffer) {
    assert(data);
    assert(data.length === HASH_LENGTH);
    this.data = data;
  }

  public getNullHash() {
    return new Buffer(32);
  }

  public get(): Buffer {
    return this.data;
  }
}

export type Key = Hash;
export type PublicKey = Hash;
export type PrivateKey = Hash;
export type KeyDerivation = Hash;
export type KeyImage = Hash;
export type Signature = Hash;




