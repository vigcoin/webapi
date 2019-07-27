import * as assert from 'assert';
import { NSNewBlock } from '../../../src/cryptonote/protocol/commands/new-block';
import { BufferStreamReader } from '../../../src/cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../../src/cryptonote/serialize/writer';
import { Command } from '../../../src/p2p/protocol/command';
import { buffer as newBlockBuffer, buffer } from './new-block';

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
});
