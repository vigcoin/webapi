import * as assert from 'assert';
import { readFileSync } from 'fs';
import * as path from 'path';
import { parameters } from '../../src/config';
import { Hash } from '../../src/crypto/hash';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import { TransactionAmount } from '../../src/cryptonote/transaction/amount';
import { Transaction } from '../../src/cryptonote/transaction/index';
import { Payment } from '../../src/cryptonote/transaction/payment';

describe('transaction test', () => {
  it('should read from buffer', () => {
    const buffer = readFileSync(
      path.resolve(__dirname, './data/transaction-sample-1.dat')
    );
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

  it('should read from buffer', () => {
    const buffer = readFileSync(
      path.resolve(__dirname, './data/transaction-sample-2.dat')
    );
    const hash = Hash.from(buffer);
    const reader = new BufferStreamReader(buffer);
    const transaction = Transaction.read(reader);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    const buffer2 = writer.getBuffer();
    assert(buffer.equals(buffer2));
    const hash2 = Hash.from(buffer2);
    assert(hash.equals(hash2));
    const inputs = TransactionAmount.getInputList(transaction);
    const outputs = TransactionAmount.getOutputList(transaction);
    assert(inputs.length > 0);
    assert(outputs.length > 0);
    const outputAmount = TransactionAmount.getOutput(transaction);
    assert(outputAmount > parameters.FUSION_TX_MIN_INPUT_COUNT);
    const inputAmount = TransactionAmount.getInput(transaction);
    assert(inputAmount > parameters.FUSION_TX_MIN_INPUT_COUNT);
    assert(TransactionAmount.check(transaction));
    assert(!TransactionAmount.isFusion(transaction));
  });

  it('should read from buffer and added by payment 1', () => {
    const buffer = readFileSync(
      path.resolve(__dirname, './data/transaction-with-nonce.dat')
    );
    const realHash = Buffer.from([
      0x8e,
      0x73,
      0x3a,
      0xc4,
      0x56,
      0x53,
      0xc8,
      0x8d,
      0x4f,
      0x4c,
      0x24,
      0x3e,
      0x75,
      0x26,
      0xc9,
      0xcb,
      0xa0,
      0x8e,
      0x5d,
      0xca,
      0x6f,
      0xf4,
      0x74,
      0x68,
      0x74,
      0x98,
      0xb8,
      0x2e,
      0xae,
      0x8b,
      0x50,
      0x83,
    ]);
    const hash = Hash.from(buffer);
    hash.equals(realHash);
    const reader = new BufferStreamReader(buffer);
    const transaction = Transaction.read(reader);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    const buffer2 = writer.getBuffer();
    assert(buffer.equals(buffer2));
    const hash2 = Hash.from(buffer2);
    assert(hash.equals(hash2));

    const payment = new Payment();
    payment.add(transaction);
  });

  it('should read from buffer and added by payment 2', () => {
    const buffer = readFileSync(
      path.resolve(__dirname, './data/transaction-with-padding.dat')
    );
    const realHash = Buffer.from([
      0x72,
      0x90,
      0x07,
      0x77,
      0x2b,
      0x65,
      0x5e,
      0xac,
      0x97,
      0x40,
      0xd2,
      0xc4,
      0x1a,
      0x23,
      0xdc,
      0x77,
      0x57,
      0x4d,
      0x76,
      0x42,
      0x08,
      0x68,
      0x03,
      0xfe,
      0x8a,
      0x93,
      0x56,
      0xe7,
      0xca,
      0x20,
      0x58,
      0x2f,
    ]);
    const hash = Hash.from(buffer);
    hash.equals(realHash);
    const reader = new BufferStreamReader(buffer);
    const transaction = Transaction.read(reader);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    Transaction.write(writer, transaction);
    const buffer2 = writer.getBuffer();
    assert(buffer.equals(buffer2));
    const hash2 = Hash.from(buffer2);
    assert(hash.equals(hash2));

    const payment = new Payment();
    payment.add(transaction);
  });
});
