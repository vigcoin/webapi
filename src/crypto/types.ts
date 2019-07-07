import * as assert from 'assert';
export const HASH_LENGTH = 32;
export const SIGNATURE_LENGTH = 64;
export const NULL_HASH: Buffer = Buffer.alloc(HASH_LENGTH);

export type Hash = Buffer; // uint8[32]
export type Key = Hash;
export type PublicKey = Hash;
export type PrivateKey = Hash;
export type KeyDerivation = Hash;
export type KeyImage = Hash;
export type Signature = Hash;
