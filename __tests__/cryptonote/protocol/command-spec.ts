import * as assert from 'assert';
import { randomBytes } from 'crypto';
import { NSNewBlock } from '../../../src/cryptonote/protocol/commands/new-block';
import { NSNewTransactions } from '../../../src/cryptonote/protocol/commands/new-transactions';
import { NSRequestGetObjects } from '../../../src/cryptonote/protocol/commands/request-get-objects';
import { NSRequestTXPool } from '../../../src/cryptonote/protocol/commands/request-tx-pool';
import { NSResponseChain } from '../../../src/cryptonote/protocol/commands/response-chain';
import { NSResponseGetObjects } from '../../../src/cryptonote/protocol/commands/response-get-objects';
import { BufferStreamReader } from '../../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../../src/cryptonote/serialize/writer';
import { Command } from '../../../src/p2p/protocol/command';
import { buffer as newBlockBuffer } from '../../data/new-block';
import { buffer as newTransactionsBuffer } from '../../data/new-transactions';
import { buffer as responseChainBuffer } from '../../data/response-chain';
import { buffer as responseGetObjectsBuffer } from '../../data/response-get-objects';
import { buffer as txPoolBuffer } from '../../data/tx-pool';

describe('test cryptonote protocol command', () => {
  it('should have proper value', () => {
    assert(Command.BASE === 2000);
    assert(Command.NOTIFY_NEW_BLOCK === 2001);
    assert(Command.NOTIFY_NEW_TRANSACTIONS === 2002);
    assert(Command.NOTIFY_REQUEST_GET_OBJECTS === 2003);
    assert(Command.NOTIFY_RESPONSE_GET_OBJECTS === 2004);
    assert(Command.NOTIFY_REQUEST_CHAIN === 2006);
    assert(Command.NOTIFY_RESPONSE_CHAIN_ENTRY === 2007);
    assert(Command.NOTIFY_REQUEST_TX_POOL === 2008);
  });

  it('should handle new block', () => {
    const request = NSNewBlock.Reader.request(
      new BufferStreamReader(newBlockBuffer)
    );
    assert(request.hop === 1);
    assert(request.currentBlockHeight === 327254);
    assert(!request.blockCompleteEntry.txs);
    assert(request.blockCompleteEntry.block.length === 387);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    NSNewBlock.Writer.request(writer, request);
    const newBuffer = writer.getBuffer();
    for (let i = 0; i < newBuffer.length; i++) {
      assert(newBlockBuffer[i] === newBuffer[i]);
    }
    assert(newBlockBuffer.equals(writer.getBuffer()));
    const buffer1 = Buffer.from([0x11, 0x12, 0x13]);
    request.blockCompleteEntry.txs = [buffer1];
    const writer1 = new BufferStreamWriter(Buffer.alloc(0));
    NSNewBlock.Writer.request(writer1, request);
    const request1 = NSNewBlock.Reader.request(
      new BufferStreamReader(writer1.getBuffer())
    );
    assert(request.blockCompleteEntry.txs.length === 1);
    assert(request.blockCompleteEntry.txs[0].equals(buffer1));
  });

  it('should handle tx pool', () => {
    const request = NSRequestTXPool.Reader.request(
      new BufferStreamReader(txPoolBuffer)
    );
    assert(!request.txs);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    NSRequestTXPool.Writer.request(writer, request);
    assert(txPoolBuffer.equals(writer.getBuffer()));
    const tx = Buffer.from([0x11, 0x12, 0x13]);
    const tx1 = Buffer.from([0x11, 0x12, 0x15]);
    request.txs = [tx, tx1];
    const writer1 = new BufferStreamWriter(Buffer.alloc(0));
    NSRequestTXPool.Writer.request(writer1, request);
    const request1 = NSRequestTXPool.Reader.request(
      new BufferStreamReader(writer1.getBuffer())
    );
    assert(request1.txs.length === 2);
    assert(request.txs[0].equals(tx));
    assert(request.txs[1].equals(tx1));
  });

  it('should handle new transactions', () => {
    const request = NSNewTransactions.Reader.request(
      new BufferStreamReader(newTransactionsBuffer)
    );
    assert(request.txs.length !== 0);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    NSNewTransactions.Writer.request(writer, request);

    const newBuffer = writer.getBuffer();
    for (let i = 0; i < newBuffer.length; i++) {
      assert(newBuffer[i] === newTransactionsBuffer[i]);
    }
    assert(newTransactionsBuffer.equals(writer.getBuffer()));
  });

  it('should handle response chain', () => {
    const request: NSResponseChain.IRequest = NSResponseChain.Reader.request(
      new BufferStreamReader(responseChainBuffer)
    );
    assert(request.blockHashes.length);
    assert(request.startHeight === 147);
    assert(request.totalHeight === 327729);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    NSResponseChain.Writer.request(writer, request);
    assert(responseChainBuffer.equals(writer.getBuffer()));
  });

  it('should handle response get objects', () => {
    const request: NSRequestGetObjects.IRequest = {
      txs: [randomBytes(32)],
    };

    const writer = new BufferStreamWriter(Buffer.alloc(0));
    NSRequestGetObjects.Writer.request(writer, request);

    const request1: NSRequestGetObjects.IRequest = NSRequestGetObjects.Reader.request(
      new BufferStreamReader(writer.getBuffer())
    );

    assert(request.txs[0].equals(request1.txs[0]));
  });
  it('should handle response get objects', () => {
    const request: NSResponseGetObjects.IRequest = NSResponseGetObjects.Reader.request(
      new BufferStreamReader(responseGetObjectsBuffer)
    );
    assert(request.currentBlockchainHeight === 328051);
    assert(request.blocks.length === 200);
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    NSResponseGetObjects.Writer.request(writer, request);
    const newBuffer = writer.getBuffer();
    for (let i = 0; i < newBuffer.length; i++) {
      assert(newBuffer[i] === responseGetObjectsBuffer[i]);
    }
    assert(responseGetObjectsBuffer.equals(writer.getBuffer()));
    request.txs = [randomBytes(34)];
    request.missedHashes = [randomBytes(32)];

    delete request.blocks[0].block;
    request.blocks[0].txs = [randomBytes(23)];
    const writer1 = new BufferStreamWriter(Buffer.alloc(0));
    NSResponseGetObjects.Writer.request(writer1, request);

    const reader1 = new BufferStreamReader(writer1.getBuffer());
    const request1: NSResponseGetObjects.IRequest = NSResponseGetObjects.Reader.request(
      reader1
    );

    assert(request1.txs.length === 1);
    assert(request1.missedHashes.length === 1);
    assert(request1.blocks[0].txs.length === 1);

    delete request.blocks;

    const writer2 = new BufferStreamWriter(Buffer.alloc(0));
    NSResponseGetObjects.Writer.request(writer2, request);

    const reader2 = new BufferStreamReader(writer2.getBuffer());
    const request2: NSResponseGetObjects.IRequest = NSResponseGetObjects.Reader.request(
      reader2
    );
    assert(!request2.blocks);
  });
});
