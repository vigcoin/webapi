import { Difficulty, Hash, Key, Signature } from '@vigcoin/neon';

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

export const CNFashHash = Hash.fast;
export const IsPublicKey = Key.check;

export const CryptoHash = Hash;
export const CryptoSignature = Signature;
export const CryptonoteDifficulty = Difficulty;
