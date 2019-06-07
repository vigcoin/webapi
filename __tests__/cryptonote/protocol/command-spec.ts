import { Command } from '../../../src/cryptonote/protocol/command';
import * as assert from 'assert';

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
});
