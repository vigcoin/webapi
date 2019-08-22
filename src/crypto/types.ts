import * as assert from 'assert';
export const HASH_LENGTH = 32;
export const SIGNATURE_LENGTH = 64;
export const NULL_HASH: Buffer = Buffer.alloc(HASH_LENGTH);

export type IHash = Buffer; // uint8[32]
export type IKey = IHash;
export type IPublicKey = IHash;
export type IPrivateKey = IHash;
export type IKeyDerivation = IHash;
export type IKeyImage = IHash;
export type ISignature = IHash;
