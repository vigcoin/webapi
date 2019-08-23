import * as assert from 'assert';
import { Hash } from '../../src/crypto/hash';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import { Transaction } from '../../src/cryptonote/transaction/index';

describe('transaction test', () => {
  it('should init from buffer', () => {
    const buffer = Buffer.from([
      0x01,
      0x3c,
      0x01,
      0xff,
      0x00,
      0x01,
      0x01,
      0x02,
      0x9b,
      0x2e,
      0x4c,
      0x02,
      0x81,
      0xc0,
      0xb0,
      0x2e,
      0x7c,
      0x53,
      0x29,
      0x1a,
      0x94,
      0xd1,
      0xd0,
      0xcb,
      0xff,
      0x88,
      0x83,
      0xf8,
      0x02,
      0x4f,
      0x51,
      0x42,
      0xee,
      0x49,
      0x4f,
      0xfb,
      0xbd,
      0x08,
      0x80,
      0x71,
      0x21,
      0x01,
      0xa9,
      0xa4,
      0x56,
      0x9f,
      0x7e,
      0x10,
      0x16,
      0x4a,
      0x32,
      0x32,
      0x4b,
      0x2b,
      0x87,
      0x8a,
      0xe3,
      0x2d,
      0x98,
      0xbe,
      0x09,
      0x49,
      0xce,
      0x6e,
      0x01,
      0x50,
      0xba,
      0x1d,
      0x7e,
      0x54,
      0xd6,
      0x09,
      0x69,
      0xe5,
    ]);
    const hash = Hash.from(buffer);
    const reader = new BufferStreamReader(buffer);
    const transaction = Transaction.read(reader);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    const buffer2 = writer.getBuffer();
    assert(buffer.equals(buffer2));

    const hash2 = Hash.from(buffer2);
    assert(hash.equals(hash2));
  });

  it('should init from buffer', () => {
    const buffer = Buffer.from([
      0x01,
      0x00,
      0x0a,
      0x02,
      0x90,
      0x4e,
      0x03,
      0xf9,
      0x11,
      0xf7,
      0x4c,
      0xc5,
      0xfd,
      0x01,
      0xd4,
      0xa9,
      0x87,
      0xef,
      0x5e,
      0xe4,
      0xe1,
      0x7b,
      0xc2,
      0x6c,
      0x93,
      0x1f,
      0x76,
      0x9e,
      0xe4,
      0xb6,
      0xd0,
      0x74,
      0x12,
      0x0a,
      0x0f,
      0x78,
      0xe6,
      0xf0,
      0x60,
      0x55,
      0x00,
      0x34,
      0xf6,
      0x01,
      0xb8,
      0xb0,
      0x02,
      0x80,
      0xf1,
      0x04,
      0x03,
      0xe7,
      0x48,
      0x99,
      0x66,
      0xf2,
      0xa7,
      0x01,
      0xc9,
      0x43,
      0x3e,
      0x10,
      0xb7,
      0x90,
      0xec,
      0xd1,
      0x3d,
      0x70,
      0x16,
      0x2e,
      0xf2,
      0x1c,
      0x54,
      0x14,
      0xcc,
      0xd9,
      0x5a,
      0xde,
      0xe2,
      0x46,
      0x36,
      0x1e,
      0x64,
      0x32,
      0x9f,
      0x4c,
      0xe8,
      0x28,
      0x28,
      0x6a,
      0x02,
      0xc0,
      0x84,
      0x3d,
      0x03,
      0xba,
      0x82,
      0x01,
      0xd2,
      0x60,
      0x93,
      0x91,
      0x01,
      0xee,
      0xa8,
      0xef,
      0xe9,
      0xdb,
      0x58,
      0x21,
      0x0a,
      0xc7,
      0x27,
      0x37,
      0x9d,
      0x49,
      0x66,
      0x35,
      0x05,
      0xf8,
      0x8a,
      0x38,
      0xe9,
      0x9b,
      0x47,
      0x7b,
      0xae,
      0xdf,
      0x2e,
      0x01,
      0x31,
      0xf5,
      0xc0,
      0x21,
      0x9a,
      0x02,
      0x1e,
      0x03,
      0xb8,
      0x39,
      0x86,
      0x0a,
      0xde,
      0x30,
      0x7e,
      0xbd,
      0x88,
      0x80,
      0x0d,
      0xb2,
      0x6f,
      0x2f,
      0xfd,
      0xaf,
      0xee,
      0xae,
      0xf3,
      0x12,
      0x57,
      0x65,
      0x43,
      0x21,
      0xa4,
      0xd1,
      0x31,
      0xcc,
      0x00,
      0x02,
      0xf4,
      0x36,
      0xa9,
      0x6c,
      0x53,
      0x10,
      0xa3,
      0x73,
      0x02,
      0xc8,
      0x01,
      0x03,
      0xcc,
      0x12,
      0xd8,
      0xb2,
      0x02,
      0xbc,
      0x16,
      0xd1,
      0x25,
      0x13,
      0xab,
      0xe8,
      0x86,
      0xca,
      0xbd,
      0x11,
      0xba,
      0xde,
      0x32,
      0x36,
      0xee,
      0x9d,
      0xa4,
      0xac,
      0x0d,
      0xa6,
      0x12,
      0x38,
      0x5c,
      0xcb,
      0x8d,
      0x51,
      0xb1,
      0x2b,
      0x15,
      0x22,
      0x3b,
      0x6d,
      0xd5,
      0x02,
      0xa0,
      0x9c,
      0x01,
      0x03,
      0xe6,
      0x31,
      0xcd,
      0x25,
      0xfc,
      0xfd,
      0x01,
      0x10,
      0xa2,
      0x00,
      0x1b,
      0xd9,
      0x6d,
      0xbb,
      0x9b,
      0x5b,
      0x47,
      0x70,
      0x73,
      0x38,
      0xe2,
      0x97,
      0x50,
      0x91,
      0x9e,
      0x9b,
      0xcf,
      0x27,
      0xde,
      0x04,
      0xa4,
      0xd5,
      0xe3,
      0xb4,
      0xf3,
      0x81,
      0xd2,
      0x9f,
      0x51,
      0x02,
      0x80,
      0xb4,
      0xc4,
      0xc3,
      0x21,
      0x03,
      0xd0,
      0x14,
      0xfc,
      0xed,
      0x01,
      0xf9,
      0x8b,
      0x01,
      0x7b,
      0x26,
      0xa7,
      0x94,
      0x66,
      0x82,
      0x81,
      0x31,
      0xc2,
      0xac,
      0x69,
      0xe4,
      0xc0,
      0x31,
      0x3c,
      0x1a,
      0x06,
      0x67,
      0xd3,
      0x21,
      0xc1,
      0xbd,
      0x25,
      0x42,
      0x7f,
      0x58,
      0x41,
      0x80,
      0x22,
      0xcb,
      0x88,
      0x2e,
      0x02,
      0xc0,
      0x3e,
      0x03,
      0xbd,
      0x81,
      0x01,
      0x85,
      0x15,
      0xd5,
      0xc2,
      0x01,
      0x41,
      0x01,
      0x0e,
      0xb0,
      0x84,
      0xcc,
      0x75,
      0xc7,
      0x82,
      0x9c,
      0x24,
      0xbd,
      0x64,
      0xa2,
      0xf3,
      0x92,
      0xf8,
      0x7d,
      0xec,
      0x86,
      0x19,
      0xa9,
      0x4f,
      0xf2,
      0x74,
      0x21,
      0x2e,
      0x96,
      0xbb,
      0xd7,
      0x80,
      0xd1,
      0x02,
      0xa0,
      0xc2,
      0x1e,
      0x03,
      0xc6,
      0x07,
      0xae,
      0xf3,
      0x01,
      0xb6,
      0x57,
      0x2d,
      0x67,
      0x97,
      0x99,
      0x48,
      0xc5,
      0xac,
      0xde,
      0x22,
      0x28,
      0x0b,
      0xde,
      0x3f,
      0x14,
      0x81,
      0x9d,
      0x63,
      0x6f,
      0xf9,
      0xb8,
      0x89,
      0xc1,
      0x94,
      0x71,
      0x0a,
      0x73,
      0x3c,
      0xa6,
      0xbe,
      0x1c,
      0x61,
      0xa5,
      0x02,
      0x80,
      0xb4,
      0xc4,
      0xc3,
      0x21,
      0x03,
      0x9d,
      0x56,
      0xdc,
      0x71,
      0xe4,
      0xc9,
      0x01,
      0x05,
      0xf6,
      0xbd,
      0xeb,
      0xf0,
      0xb7,
      0x69,
      0xef,
      0x35,
      0xcc,
      0x2f,
      0x8e,
      0xbe,
      0x60,
      0xcd,
      0x84,
      0x39,
      0xb1,
      0x2f,
      0xad,
      0xbe,
      0x58,
      0xfd,
      0x26,
      0x59,
      0xc6,
      0x6a,
      0x0e,
      0x39,
      0x43,
      0x0e,
      0x45,
      0x08,
      0x1e,
      0x02,
      0xde,
      0x25,
      0xca,
      0x65,
      0xf9,
      0xba,
      0x0d,
      0x27,
      0xd1,
      0x2d,
      0xb6,
      0x65,
      0xcc,
      0x53,
      0xcb,
      0x77,
      0x82,
      0xd4,
      0x2d,
      0x07,
      0x0e,
      0xa4,
      0x08,
      0x3d,
      0x42,
      0xcb,
      0x2f,
      0xc8,
      0x70,
      0x4e,
      0xc3,
      0x68,
      0xc8,
      0x01,
      0x02,
      0xab,
      0xa8,
      0x9d,
      0x19,
      0x44,
      0xec,
      0x86,
      0x5c,
      0x21,
      0xe0,
      0xd1,
      0xe9,
      0xab,
      0x2e,
      0xe6,
      0x76,
      0x4f,
      0xf1,
      0x1e,
      0x4f,
      0xa0,
      0xae,
      0x05,
      0x58,
      0x75,
      0x9f,
      0xdf,
      0xf0,
      0xec,
      0xe7,
      0x95,
      0x00,
      0xc0,
      0x3e,
      0x02,
      0x74,
      0xc4,
      0x0e,
      0x1c,
      0xf4,
      0xe7,
      0xe9,
      0x63,
      0x20,
      0x5b,
      0x5a,
      0x89,
      0x28,
      0xf2,
      0xd1,
      0xd8,
      0xc1,
      0xe9,
      0x76,
      0xda,
      0x23,
      0x68,
      0x50,
      0x1a,
      0xda,
      0x03,
      0x46,
      0x26,
      0xd6,
      0x9e,
      0x95,
      0x2f,
      0xe0,
      0xd4,
      0x03,
      0x02,
      0x16,
      0x9e,
      0x69,
      0xb6,
      0xe6,
      0xe5,
      0xb8,
      0xd8,
      0xd4,
      0x6d,
      0xaa,
      0xfc,
      0xca,
      0x0b,
      0xc7,
      0x96,
      0x9f,
      0xfe,
      0xdc,
      0x73,
      0xd3,
      0xfb,
      0x61,
      0xd5,
      0x9a,
      0x8e,
      0xaa,
      0x19,
      0x38,
      0xe3,
      0x52,
      0xe4,
      0xa0,
      0xc2,
      0x1e,
      0x02,
      0x10,
      0x94,
      0x27,
      0xab,
      0x1f,
      0xb0,
      0x08,
      0x40,
      0x42,
      0x54,
      0xc7,
      0xcf,
      0xb8,
      0x5d,
      0xe1,
      0xd1,
      0x30,
      0x90,
      0x80,
      0x89,
      0xa8,
      0x72,
      0xe9,
      0x31,
      0xbb,
      0x8c,
      0xea,
      0xbb,
      0x16,
      0xd4,
      0x30,
      0xaf,
      0xc0,
      0x84,
      0x3d,
      0x02,
      0x4e,
      0xb6,
      0x81,
      0x68,
      0x2d,
      0x3b,
      0xdd,
      0x0b,
      0x9d,
      0x9c,
      0xb6,
      0x78,
      0x83,
      0xb7,
      0x9b,
      0xf9,
      0x0e,
      0x8a,
      0x0d,
      0xf3,
      0xac,
      0x6d,
      0x9f,
      0xcd,
      0x69,
      0xc1,
      0xb8,
      0xb7,
      0xfb,
      0x35,
      0xdf,
      0x1f,
      0x80,
      0xa0,
      0xd9,
      0xe6,
      0x1d,
      0x02,
      0xb9,
      0xa4,
      0x72,
      0x5d,
      0x2e,
      0x71,
      0x14,
      0x50,
      0x82,
      0x44,
      0x53,
      0xde,
      0xe3,
      0x26,
      0xb4,
      0x0d,
      0xc2,
      0x83,
      0xd3,
      0x04,
      0xe2,
      0x8a,
      0xad,
      0x89,
      0x8d,
      0xc9,
      0xea,
      0x57,
      0xd3,
      0x4d,
      0xbc,
      0x15,
      0x80,
      0xc8,
      0xaf,
      0xa0,
      0x25,
      0x02,
      0x72,
      0xb0,
      0xa5,
      0xbd,
      0x93,
      0x57,
      0x63,
      0x48,
      0x6f,
      0x0a,
      0x90,
      0x7b,
      0xe3,
      0x63,
      0x5b,
      0xb5,
      0x69,
      0xb7,
      0x53,
      0xed,
      0x2b,
      0xa7,
      0x60,
      0x84,
      0x27,
      0xc6,
      0xa0,
      0x99,
      0xc1,
      0xce,
      0xf9,
      0xd0,
      0x21,
      0x01,
      0x2b,
      0x66,
      0x48,
      0x3d,
      0xf7,
      0xc7,
      0x71,
      0x59,
      0xf1,
      0x4f,
      0x12,
      0x6e,
      0xe4,
      0x8f,
      0x12,
      0x3e,
      0x20,
      0xd5,
      0x96,
      0x09,
      0xaa,
      0xce,
      0xc1,
      0x65,
      0xc1,
      0xf7,
      0xf6,
      0xe4,
      0x0a,
      0xd8,
      0x85,
      0xd0,
      0x0c,
      0x5c,
      0x5f,
      0x36,
      0x90,
      0xe0,
      0xe6,
      0xf7,
      0xf3,
      0x1a,
      0x32,
      0x66,
      0x0e,
      0x11,
      0x34,
      0x4d,
      0xba,
      0x56,
      0x58,
      0x39,
      0x02,
      0xdf,
      0x77,
      0x72,
      0x58,
      0x52,
      0x85,
      0x8e,
      0x44,
      0xbd,
      0x15,
      0x0b,
      0xdb,
      0x3f,
      0x37,
      0x24,
      0x71,
      0xcb,
      0x1d,
      0x7a,
      0xbb,
      0x8e,
      0xf1,
      0xf4,
      0x91,
      0x57,
      0xff,
      0x22,
      0x6a,
      0x57,
      0xcd,
      0xaa,
      0xd1,
      0xce,
      0x8b,
      0xbb,
      0x7e,
      0x1b,
      0xb8,
      0x04,
      0x73,
      0x62,
      0xf3,
      0x07,
      0x86,
      0xe9,
      0x9e,
      0x4e,
      0x11,
      0x2e,
      0x83,
      0xb0,
      0x32,
      0x4c,
      0xc1,
      0x76,
      0x9b,
      0xde,
      0x47,
      0x2e,
      0x9b,
      0x73,
      0x83,
      0xae,
      0x2e,
      0x5b,
      0xcd,
      0xaa,
      0x84,
      0x4f,
      0x69,
      0xb9,
      0xf0,
      0xc2,
      0x68,
      0x0b,
      0x02,
      0xf9,
      0xe9,
      0xf9,
      0x77,
      0x46,
      0xcd,
      0xc4,
      0x39,
      0xe5,
      0xb9,
      0xce,
      0xd5,
      0x5c,
      0x6a,
      0x66,
      0x66,
      0x91,
      0x05,
      0x59,
      0xe9,
      0x6f,
      0x82,
      0x4b,
      0x2c,
      0x55,
      0x9b,
      0x4e,
      0x66,
      0xdf,
      0xdd,
      0x03,
      0x6b,
      0x4e,
      0x39,
      0xe7,
      0x92,
      0xa5,
      0xd0,
      0x10,
      0x23,
      0xd0,
      0x57,
      0xb5,
      0xa9,
      0x58,
      0x9a,
      0x8b,
      0x82,
      0x41,
      0xa3,
      0x90,
      0x26,
      0x2b,
      0xda,
      0xab,
      0x33,
      0xd1,
      0x8c,
      0x49,
      0x29,
      0x97,
      0xd7,
      0x00,
      0xe4,
      0xd0,
      0x02,
      0x7f,
      0x43,
      0xa3,
      0xdb,
      0x9d,
      0xbf,
      0xf7,
      0xf8,
      0x02,
      0x77,
      0x5e,
      0xea,
      0x7f,
      0xa5,
      0xd8,
      0xcb,
      0x03,
      0x10,
      0x8e,
      0x00,
      0x24,
      0x21,
      0xc0,
      0x24,
      0x73,
      0xf2,
      0x72,
      0x17,
      0x0b,
      0x24,
      0xf6,
      0x46,
      0x96,
      0x9d,
      0x2a,
      0xdb,
      0x85,
      0xf0,
      0x52,
      0xa9,
      0x11,
      0x36,
      0x40,
      0x51,
      0xca,
      0x35,
      0xac,
      0xe1,
      0x2a,
      0xec,
      0xad,
      0x72,
      0x0c,
      0x00,
      0x90,
      0x19,
      0x08,
      0x86,
      0x62,
      0x1f,
      0x05,
      0xb6,
      0xd1,
      0x57,
      0x1f,
      0x7b,
      0xec,
      0xfc,
      0x9c,
      0x43,
      0x75,
      0xfe,
      0x46,
      0x4b,
      0xdd,
      0x9e,
      0xbb,
      0x42,
      0xd4,
      0xd0,
      0x43,
      0xc4,
      0x5a,
      0x16,
      0x81,
      0xa2,
      0x3d,
      0x83,
      0xe6,
      0x5a,
      0x44,
      0xd9,
      0x0a,
      0xcf,
      0x88,
      0x48,
      0xb7,
      0x04,
      0xe6,
      0x6d,
      0x77,
      0xde,
      0xa9,
      0x8b,
      0xb6,
      0x13,
      0x51,
      0x0c,
      0x8a,
      0xfa,
      0x32,
      0x8d,
      0xa3,
      0x4a,
      0x0a,
      0x5e,
      0xa5,
      0x13,
      0x44,
      0x5c,
      0xbd,
      0x72,
      0xb5,
      0x7f,
      0x05,
      0xca,
      0xef,
      0xf7,
      0x0f,
      0x69,
      0x80,
      0xb8,
      0xb0,
      0xfe,
      0xe9,
      0x7c,
      0xc7,
      0x38,
      0x45,
      0x0b,
      0x61,
      0x01,
      0xe9,
      0x65,
      0x23,
      0x78,
      0x88,
      0x8e,
      0xaf,
      0x92,
      0x46,
      0x00,
      0x9e,
      0x46,
      0x38,
      0x16,
      0x09,
      0xcc,
      0xa1,
      0xca,
      0xb7,
      0x58,
      0x44,
      0xfc,
      0x5c,
      0x03,
      0x5b,
      0x45,
      0x22,
      0xe7,
      0xec,
      0xdb,
      0xad,
      0x06,
      0x6a,
      0x29,
      0xa7,
      0x28,
      0xaa,
      0x86,
      0x9c,
      0x2d,
      0x8c,
      0xce,
      0xf5,
      0xfa,
      0xbc,
      0x9e,
      0x0b,
      0x64,
      0xe5,
      0xe4,
      0x21,
      0x2f,
      0xb8,
      0x82,
      0xa5,
      0xde,
      0xd3,
      0xd1,
      0x1c,
      0xc5,
      0x80,
      0xe3,
      0x08,
      0xce,
      0x29,
      0x90,
      0x96,
      0x1a,
      0x0e,
      0xd6,
      0xd9,
      0xb1,
      0x4a,
      0x3f,
      0xc4,
      0x48,
      0x6a,
      0x56,
      0x07,
      0x9d,
      0x0a,
      0x4b,
      0x3b,
      0xb2,
      0x15,
      0x87,
      0x05,
      0x06,
      0x2d,
      0x8f,
      0xdb,
      0xba,
      0x1f,
      0xda,
      0x4b,
      0xe1,
      0xf9,
      0x22,
      0xfd,
      0x13,
      0xd0,
      0x1d,
      0x06,
      0x66,
      0x75,
      0x21,
      0xc9,
      0xea,
      0xc0,
      0x8b,
      0x06,
      0x28,
      0xe4,
      0x03,
      0x87,
      0x82,
      0x16,
      0x5b,
      0x4d,
      0xc1,
      0x11,
      0x43,
      0xb2,
      0xe6,
      0x15,
      0x5d,
      0x23,
      0xe4,
      0x64,
      0x68,
      0x8e,
      0xaf,
      0x5f,
      0x0f,
      0xb5,
      0x36,
      0x23,
      0xa6,
      0xfa,
      0x8d,
      0x20,
      0x3b,
      0x00,
      0xae,
      0xf5,
      0xb1,
      0x52,
      0xa8,
      0xcd,
      0xd0,
      0xa7,
      0xde,
      0x6d,
      0x17,
      0x2c,
      0x02,
      0xe2,
      0x96,
      0x18,
      0xef,
      0x28,
      0x79,
      0xed,
      0x31,
      0x05,
      0xe5,
      0x09,
      0x49,
      0xc8,
      0xba,
      0x26,
      0xa4,
      0x00,
      0x23,
      0x00,
      0x37,
      0xfe,
      0xc9,
      0x0b,
      0xc2,
      0x45,
      0x88,
      0x63,
      0x7b,
      0xbb,
      0xbd,
      0x74,
      0xee,
      0x0e,
      0xcf,
      0xb8,
      0x75,
      0x14,
      0x00,
      0x38,
      0xc8,
      0xfe,
      0x51,
      0xe4,
      0x3c,
      0x8f,
      0x69,
      0x87,
      0x06,
      0xbd,
      0xed,
      0x0c,
      0x45,
      0x53,
      0x89,
      0xde,
      0x22,
      0xcd,
      0x2e,
      0x40,
      0x17,
      0x9a,
      0x8b,
      0x21,
      0x07,
      0xa7,
      0xa7,
      0x58,
      0x93,
      0x26,
      0x9b,
      0x49,
      0x18,
      0xdd,
      0xe9,
      0xc4,
      0x20,
      0x07,
      0x22,
      0xeb,
      0x71,
      0x36,
      0x01,
      0x00,
      0xe7,
      0xdf,
      0xe3,
      0x3b,
      0x01,
      0xf3,
      0x74,
      0xfd,
      0xa0,
      0xed,
      0xb5,
      0xb0,
      0x94,
      0xee,
      0x7d,
      0x6a,
      0x56,
      0x9e,
      0xdb,
      0x52,
      0x64,
      0x7b,
      0x43,
      0x6d,
      0x19,
      0x95,
      0x79,
      0x37,
      0xcf,
      0xb8,
      0x5f,
      0x05,
      0x8c,
      0xe4,
      0x52,
      0x9e,
      0x4c,
      0xc1,
      0xd0,
      0x8a,
      0x18,
      0x7d,
      0xd2,
      0x12,
      0x07,
      0xaf,
      0xb6,
      0x16,
      0xa0,
      0x80,
      0xc9,
      0x2b,
      0x7d,
      0xf2,
      0x62,
      0xe7,
      0x5b,
      0xb7,
      0x28,
      0x7c,
      0xd6,
      0xb0,
      0x1a,
      0x07,
      0xa3,
      0x09,
      0xf4,
      0xca,
      0xb8,
      0x99,
      0x27,
      0x4f,
      0x28,
      0xdd,
      0x9c,
      0xef,
      0x87,
      0xae,
      0x79,
      0xb9,
      0xe2,
      0xbb,
      0xfc,
      0x7e,
      0xe9,
      0xd8,
      0x3d,
      0x40,
      0x9b,
      0x34,
      0x3e,
      0xbb,
      0x75,
      0x59,
      0x3a,
      0x09,
      0x92,
      0x0f,
      0xdf,
      0x24,
      0x19,
      0xdf,
      0x60,
      0xac,
      0x41,
      0xe0,
      0x9c,
      0x95,
      0x09,
      0x19,
      0x0e,
      0xa6,
      0x02,
      0x7e,
      0x28,
      0xc5,
      0x5e,
      0xf5,
      0x2d,
      0xa0,
      0x5c,
      0xed,
      0x07,
      0xfb,
      0xd7,
      0x56,
      0xee,
      0x01,
      0x3c,
      0x9e,
      0x40,
      0xa9,
      0x31,
      0xa0,
      0x57,
      0x7d,
      0x1d,
      0x44,
      0xd8,
      0xcf,
      0xcd,
      0x94,
      0x1d,
      0x36,
      0xfd,
      0x3e,
      0x2d,
      0xe2,
      0xda,
      0xb3,
      0x7d,
      0x71,
      0x10,
      0x24,
      0x0a,
      0x4a,
      0x43,
      0xec,
      0xd8,
      0x04,
      0x91,
      0xcc,
      0x9b,
      0x26,
      0x54,
      0xcf,
      0x45,
      0x93,
      0xf3,
      0x9b,
      0x4d,
      0xdf,
      0x54,
      0x06,
      0x0e,
      0xe0,
      0x83,
      0x55,
      0xdc,
      0xd5,
      0x5f,
      0xdb,
      0x4c,
      0xf9,
      0x22,
      0x13,
      0x1f,
      0x42,
      0x2a,
      0x17,
      0x6c,
      0x0d,
      0x65,
      0x26,
      0x26,
      0x15,
      0xf6,
      0x68,
      0x04,
      0xd2,
      0x3f,
      0x8d,
      0x05,
      0x82,
      0xa1,
      0x69,
      0x9d,
      0x7f,
      0x0c,
      0x0f,
      0xfc,
      0x5c,
      0xa1,
      0x9b,
      0x4c,
      0xf2,
      0xa6,
      0xd8,
      0x09,
      0xb9,
      0x0b,
      0x0d,
      0xd9,
      0x00,
      0x81,
      0xef,
      0x16,
      0x0c,
      0x50,
      0x13,
      0x16,
      0x22,
      0x15,
      0x83,
      0x0a,
      0x64,
      0xb4,
      0x77,
      0x16,
      0x39,
      0x8d,
      0x54,
      0x5e,
      0x2d,
      0x4c,
      0xfb,
      0x96,
      0x04,
      0x39,
      0x0c,
      0xae,
      0x65,
      0x2d,
      0xac,
      0x40,
      0x09,
      0x31,
      0x11,
      0x42,
      0xdf,
      0x67,
      0x1c,
      0x73,
      0x64,
      0xfe,
      0x6d,
      0xa5,
      0x37,
      0x7b,
      0x89,
      0xc2,
      0x28,
      0xe2,
      0x30,
      0xe9,
      0xe4,
      0xdb,
      0x69,
      0x4a,
      0x32,
      0x36,
      0xce,
      0x5b,
      0xdf,
      0x8d,
      0x69,
      0x61,
      0x05,
      0xb4,
      0x3e,
      0xf7,
      0x39,
      0x60,
      0x5f,
      0xf0,
      0x13,
      0xaa,
      0xf5,
      0x42,
      0x98,
      0xcc,
      0xaf,
      0x60,
      0x70,
      0x9c,
      0x48,
      0x12,
      0x8a,
      0x0a,
      0xd2,
      0x30,
      0x62,
      0x92,
      0x84,
      0xd8,
      0xf6,
      0xfe,
      0xbf,
      0x0f,
      0x08,
      0x2f,
      0x70,
      0x7c,
      0x11,
      0xe5,
      0x9d,
      0x1d,
      0xde,
      0x0a,
      0xd7,
      0xde,
      0xba,
      0x2f,
      0x4b,
      0x10,
      0xdb,
      0xa7,
      0x2b,
      0x80,
      0x91,
      0x09,
      0xb3,
      0xd9,
      0x3f,
      0x82,
      0x4a,
      0xf5,
      0x71,
      0xe9,
      0x6f,
      0x5b,
      0x09,
      0x58,
      0xaa,
      0x60,
      0x7d,
      0xa9,
      0xbe,
      0x36,
      0x00,
      0x27,
      0x2d,
      0xd4,
      0x55,
      0x7d,
      0xb3,
      0xc3,
      0x29,
      0x8d,
      0xdf,
      0xce,
      0xa2,
      0x8c,
      0x89,
      0x58,
      0x05,
      0xa3,
      0x76,
      0x87,
      0x8d,
      0x36,
      0xee,
      0xf4,
      0x0d,
      0xd6,
      0x4d,
      0x68,
      0x31,
      0x7d,
      0xcc,
      0x5f,
      0x3c,
      0x49,
      0x6f,
      0xb7,
      0xfd,
      0xde,
      0xca,
      0xf4,
      0x95,
      0xf7,
      0xef,
      0xdb,
      0x3a,
      0x6a,
      0xa6,
      0x2e,
      0x91,
      0x84,
      0x08,
      0x31,
      0xf4,
      0x06,
      0xc6,
      0xca,
      0x0e,
      0xfe,
      0x50,
      0x37,
      0x54,
      0xe8,
      0x50,
      0x03,
      0x28,
      0x19,
      0x5e,
      0x20,
      0xd6,
      0xac,
      0xe8,
      0xa7,
      0x9e,
      0xde,
      0xd5,
      0x77,
      0x01,
      0xc7,
      0x03,
      0x0e,
      0x93,
      0x5d,
      0x68,
      0x98,
      0x82,
      0xc1,
      0x31,
      0x18,
      0x00,
      0xc2,
      0xda,
      0x86,
      0x03,
      0xda,
      0x05,
      0x08,
      0xb8,
      0xa0,
      0x3e,
      0xf8,
      0x70,
      0xa0,
      0x4a,
      0x1d,
      0x75,
      0x64,
      0x28,
      0xbb,
      0xec,
      0xa5,
      0x55,
      0x2e,
      0xc0,
      0xbb,
      0x49,
      0xf9,
      0x53,
      0x63,
      0xb4,
      0xd4,
      0x01,
      0xfa,
      0xb4,
      0x47,
      0xbd,
      0xb2,
      0x74,
      0x83,
      0x50,
      0x93,
      0xd9,
      0x4d,
      0xdb,
      0xd7,
      0x05,
      0xba,
      0x77,
      0x14,
      0x57,
      0x60,
      0x70,
      0x11,
      0x76,
      0x0f,
      0x78,
      0x2a,
      0xca,
      0xbe,
      0x8e,
      0xb7,
      0xfb,
      0x66,
      0x0a,
      0xb9,
      0x17,
      0xdf,
      0x61,
      0x25,
      0x9a,
      0x21,
      0x82,
      0xe1,
      0xc6,
      0x13,
      0x34,
      0x60,
      0x6e,
      0x29,
      0xec,
      0xc7,
      0x4b,
      0x56,
      0xed,
      0x17,
      0x47,
      0xea,
      0x92,
      0x51,
      0x88,
      0xf6,
      0x42,
      0x6b,
      0xf7,
      0x94,
      0x02,
      0xb3,
      0x46,
      0x61,
      0x79,
      0x51,
      0xef,
      0x21,
      0xd9,
      0xd1,
      0x7e,
      0x53,
      0x71,
      0x47,
      0xd6,
      0x69,
      0x3c,
      0x6b,
      0x89,
      0xfe,
      0x44,
      0x21,
      0x49,
      0x59,
      0x12,
      0xed,
      0x63,
      0x60,
      0xf4,
      0xc4,
      0x8d,
      0x1d,
      0x03,
      0xed,
      0xfa,
      0x4a,
      0xb9,
      0xfc,
      0x81,
      0x9b,
      0x29,
      0x28,
      0x90,
      0x5e,
      0xac,
      0x90,
      0xb3,
      0xcd,
      0x67,
      0xac,
      0xa7,
      0x52,
      0xe9,
      0x6c,
      0x3f,
      0xfe,
      0x82,
      0x26,
      0x90,
      0x0d,
      0xe9,
      0x2f,
      0xf8,
      0xf5,
      0x0a,
      0xbd,
      0x4e,
      0xb8,
      0x7e,
      0x3d,
      0xae,
      0xe0,
      0x46,
      0x7d,
      0x2c,
      0x1f,
      0x6c,
      0x70,
      0x72,
      0xfc,
      0xd1,
      0x0e,
      0x56,
      0xd0,
      0xd0,
      0xfd,
      0xa9,
      0x18,
      0x14,
      0x1e,
      0xc9,
      0x1a,
      0x5c,
      0xe8,
      0x8f,
      0x3a,
      0x0d,
      0xb9,
      0x8d,
      0x1b,
      0x76,
      0x98,
      0xa1,
      0x66,
      0xfc,
      0x0f,
      0xce,
      0xe5,
      0xa8,
      0x3b,
      0xd6,
      0xa9,
      0x87,
      0xe7,
      0x42,
      0xfa,
      0xfe,
      0x05,
      0xa9,
      0x34,
      0xd1,
      0xee,
      0xf3,
      0xe9,
      0xbb,
      0x73,
      0x16,
      0x3d,
      0x00,
      0xac,
      0x1f,
      0xb2,
      0xd6,
      0x4b,
      0xca,
      0xd9,
      0x18,
      0xa0,
      0x60,
      0xcb,
      0xe9,
      0xa5,
      0xa5,
      0x90,
      0x96,
      0xb4,
      0x80,
      0xde,
      0x29,
      0x05,
      0x78,
      0x33,
      0x28,
      0xc1,
      0x47,
      0x38,
      0xbb,
      0x6d,
      0x15,
      0x1b,
      0x0e,
      0x7b,
      0xcf,
      0xc0,
      0x93,
      0x28,
      0x60,
      0x6e,
      0xc3,
      0x74,
      0xfa,
      0x7c,
      0x6e,
      0x34,
      0x21,
      0x49,
      0x10,
      0xd6,
      0xb4,
      0x80,
      0xb5,
      0x7e,
      0x79,
      0x08,
      0x99,
      0xe5,
      0xb4,
      0x4b,
      0xef,
      0x67,
      0xab,
      0x49,
      0x07,
      0xb8,
      0x1c,
      0xcd,
      0x98,
      0xf4,
      0x08,
      0x76,
      0x3e,
      0xf5,
      0x8b,
      0x25,
      0x9b,
      0xcf,
      0xfa,
      0x5d,
      0x03,
      0x3e,
      0xb3,
      0x28,
      0x07,
      0xad,
      0xfa,
      0x9a,
      0xa1,
      0x3e,
      0xb0,
      0x61,
      0x68,
      0xaa,
      0xd6,
      0x8e,
      0x04,
      0x30,
      0x0a,
      0xb2,
      0x82,
      0xf2,
      0x4a,
      0x46,
      0x51,
      0x63,
      0xa3,
      0x0d,
      0xb1,
      0xb1,
      0x50,
      0xea,
      0xfa,
      0xeb,
      0x21,
      0xcc,
      0x5a,
      0x3e,
      0x0a,
      0xda,
      0x06,
      0x01,
      0xf1,
      0xba,
      0xea,
      0x8f,
      0x65,
      0xe2,
      0x06,
      0xcd,
      0x61,
      0x7f,
      0x7c,
      0x85,
      0xe7,
      0x90,
      0xc3,
      0xae,
      0x4c,
      0x18,
      0x77,
      0x76,
      0xae,
      0x0b,
      0x36,
      0x12,
      0x43,
      0xe5,
      0x4c,
      0x6c,
      0xc0,
      0x6f,
      0x5d,
      0x82,
      0x86,
      0xf5,
      0x01,
      0x87,
      0x2b,
      0xd4,
      0x0d,
      0x7d,
      0x68,
      0x14,
      0xf5,
      0x82,
      0x1b,
      0xfc,
      0xf4,
      0xaa,
      0xb1,
      0xf8,
      0xab,
      0x32,
      0x67,
      0xe1,
      0xee,
      0x95,
      0x4c,
      0xd0,
      0x82,
      0x86,
      0xeb,
      0x44,
      0xda,
      0x95,
      0x6d,
      0x89,
      0x97,
      0x08,
      0x2b,
      0x7b,
      0x01,
      0xdd,
      0x96,
      0x30,
      0xca,
      0xfb,
      0x5d,
      0x70,
      0xf6,
      0x53,
      0x53,
      0xd9,
      0xe0,
      0xf8,
      0x08,
      0xdf,
      0x68,
      0x8b,
      0xdc,
      0x60,
      0xcd,
      0xb7,
      0x69,
      0xe7,
      0xe0,
      0x8d,
      0xd2,
      0x2e,
      0x58,
      0xf1,
      0x57,
      0xd1,
      0x00,
      0x90,
      0xe7,
      0x09,
      0x08,
      0xae,
      0xbe,
      0x3e,
      0x7c,
      0x28,
      0x4e,
      0x45,
      0x63,
      0x9f,
      0x8c,
      0x97,
      0x9b,
      0x09,
      0x1e,
      0x67,
      0xc8,
      0xd4,
      0x3b,
      0xba,
      0x55,
      0xef,
      0x7d,
      0x4d,
      0xc4,
      0x31,
      0x5f,
      0x86,
      0x0c,
      0x2a,
      0x01,
      0xd0,
      0xab,
      0x3d,
      0x43,
      0xb9,
      0x2c,
      0xdf,
      0xa2,
      0x2f,
      0xf7,
      0x0d,
      0xf0,
      0x0a,
      0x3a,
      0x9f,
      0x3a,
      0x1e,
      0x9b,
      0xa6,
      0x8f,
      0xe1,
      0xe6,
      0xa7,
      0x89,
      0x2a,
      0x0b,
      0x6c,
      0xab,
      0x25,
      0x0f,
      0x97,
      0xaa,
      0x38,
      0x18,
      0x80,
      0xbc,
      0x58,
      0x2e,
      0x17,
      0x75,
      0xdd,
      0x8d,
      0x8f,
      0x43,
      0xdf,
      0x9b,
      0x60,
      0x54,
      0x7f,
      0xd4,
      0xfd,
      0x12,
      0xe0,
      0xfd,
      0xc6,
      0x8f,
      0x85,
      0xff,
      0xc2,
      0xcc,
      0xa5,
      0x04,
      0x74,
      0x7a,
      0xde,
      0x93,
      0x45,
      0x90,
      0xa0,
      0xd2,
      0xe1,
      0x0f,
      0xef,
      0x94,
      0xe0,
      0x0a,
      0x10,
      0x3d,
      0xd3,
      0x80,
      0xc6,
      0x05,
      0x89,
      0x32,
      0x8a,
      0xf9,
      0x0a,
      0xf1,
      0x33,
      0x0f,
      0x1c,
      0x8b,
      0x7c,
      0x0b,
      0x14,
      0x91,
      0x16,
      0x92,
      0xb5,
      0xe5,
      0x44,
      0x70,
      0x96,
      0x51,
      0xf6,
      0xae,
      0x5e,
      0x53,
      0x40,
      0x4f,
      0x75,
      0xc7,
      0x0e,
      0x02,
      0xc7,
      0x32,
      0xfa,
      0xb8,
      0x26,
      0x7c,
      0x02,
      0xd1,
      0x0c,
      0x1d,
      0x24,
      0x03,
      0xf9,
      0x3c,
      0xb1,
      0x2a,
      0xdd,
      0xae,
      0x84,
      0xb2,
      0xd9,
      0x8f,
      0xc5,
      0x62,
      0xa8,
      0x05,
      0xf9,
      0x85,
      0x59,
      0x0d,
      0xe9,
      0x3b,
      0x6b,
      0xd0,
      0x4f,
      0x69,
      0x23,
      0x2c,
      0x32,
      0x4a,
      0xa5,
      0xa7,
      0xe5,
      0x09,
      0xaf,
      0x3b,
      0x2e,
      0xf9,
      0xfd,
      0x92,
      0xb5,
      0x30,
      0x37,
      0xff,
      0x30,
      0x04,
      0x48,
      0x4d,
      0x3b,
      0xf8,
      0x57,
      0x93,
      0x9e,
      0x0b,
      0x6e,
      0xa8,
      0xb0,
      0xe4,
      0x3c,
      0xce,
      0xab,
      0x92,
      0x31,
      0x0a,
      0x9f,
      0x09,
      0x44,
      0xc8,
      0x67,
      0xb2,
      0x6d,
      0x12,
      0xa8,
      0x4f,
      0x38,
      0x53,
      0x7f,
      0xe5,
      0xfa,
      0x46,
      0xab,
      0xb9,
      0x69,
      0xfd,
      0xda,
      0x5e,
      0x97,
      0xc9,
      0xbd,
      0x49,
      0xc3,
      0x04,
      0xa2,
      0x46,
      0x30,
      0x5b,
      0xda,
      0x07,
      0x15,
      0x79,
      0x64,
      0x1d,
      0x06,
      0x97,
      0x0f,
      0xf2,
      0x9a,
      0xcf,
      0x30,
      0x99,
      0x03,
      0xa0,
      0x05,
      0x49,
      0xd9,
      0xf6,
      0x89,
      0x4d,
      0xf7,
      0xfa,
      0x23,
      0x8c,
      0x3e,
      0x67,
      0x71,
      0xed,
      0x2d,
      0xbe,
      0x8b,
      0x00,
      0xde,
      0x18,
      0x22,
      0xdd,
      0x75,
      0x53,
      0xff,
      0x56,
      0x9a,
      0xbe,
      0xf8,
      0xe0,
      0x33,
      0x5a,
      0x88,
      0x07,
      0x63,
      0x00,
      0x5a,
      0x4d,
      0x47,
      0x57,
      0x3d,
      0xf8,
      0x35,
      0xeb,
      0x20,
      0x03,
      0x4e,
      0x34,
      0x1c,
      0x03,
      0xd4,
      0x40,
      0xa4,
      0xd6,
      0x10,
      0x06,
      0x5d,
      0xf9,
      0x1a,
      0x39,
      0x0e,
      0x39,
      0xd2,
      0x61,
      0xda,
      0xd5,
      0x5a,
      0x93,
      0x2e,
      0x5e,
      0x2d,
      0xd8,
      0x2b,
      0xfc,
      0x91,
      0xfa,
      0x96,
      0xd9,
      0xc1,
      0x97,
      0x39,
      0x03,
      0xa4,
      0x04,
      0x92,
      0xfd,
      0x18,
      0xc0,
      0x1e,
      0x91,
      0x6a,
      0x53,
      0xe7,
      0xaf,
      0x1d,
      0xed,
      0x5e,
      0x8b,
      0x58,
      0x48,
      0x2f,
      0xcd,
      0xf0,
      0x3a,
      0x2f,
      0x9d,
      0xea,
      0x9e,
      0xa3,
      0x8d,
      0x8c,
      0xdc,
      0x82,
      0x09,
      0x5b,
      0xed,
      0x76,
      0xa5,
      0x05,
      0x00,
      0xda,
      0xc6,
      0x48,
      0x16,
      0x2a,
      0x53,
      0x22,
      0x78,
      0x18,
      0x48,
      0x7f,
      0x5d,
      0xec,
      0xbc,
      0x14,
      0x02,
      0xa0,
      0xcb,
      0xdc,
      0x7a,
      0x63,
      0x4e,
      0x05,
      0xd5,
      0x41,
      0x03,
      0x16,
      0xfc,
      0x07,
      0xb3,
      0xa0,
      0x04,
      0x70,
      0xa2,
      0x59,
      0x26,
      0x50,
      0x5c,
      0x07,
      0xfc,
      0x2f,
      0xcc,
      0xed,
      0x30,
      0xeb,
      0xf3,
      0x8f,
      0xa2,
      0x69,
      0x96,
      0xea,
      0x1f,
      0x63,
      0x0f,
      0xa9,
      0x36,
      0x77,
      0x02,
      0x5a,
      0xfe,
      0xab,
      0xeb,
      0x74,
      0xaa,
      0x78,
      0x8f,
      0x51,
      0x67,
      0x0f,
      0x45,
      0xdf,
      0x2d,
      0x04,
      0x1d,
      0x1b,
      0xd6,
      0x69,
      0x68,
      0x12,
      0x74,
      0xd8,
      0x99,
      0x52,
      0x35,
      0xbb,
      0x70,
      0xb1,
      0x87,
      0x5e,
      0x0b,
    ]);
    const hash = Hash.from(buffer);
    const reader = new BufferStreamReader(buffer);
    const transaction = Transaction.read(reader);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    const buffer2 = writer.getBuffer();
    // for (let i = 0; i < buffer2.length; i++) {
    //   assert(buffer[i] === buffer2[i]);
    // }
    assert(buffer.equals(buffer2));
    const hash2 = Hash.from(buffer2);
    assert(hash.equals(hash2));
  });
});
