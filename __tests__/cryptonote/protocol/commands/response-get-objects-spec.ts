import * as assert from 'assert';
import { readFileSync } from 'fs';
import * as path from 'path';
import { NSResponseGetObjects } from '../../../../src/cryptonote/protocol/commands/response-get-objects';
import { BufferStreamReader } from '../../../../src/cryptonote/serialize/reader';

describe('serialize response get objects', () => {
  it('should read response get objects stock data', () => {
    const buffer = readFileSync(
      path.resolve(__dirname, './data/response-get-objects.bin')
    );
    assert(buffer.length === 82963);

    const request: NSResponseGetObjects.IRequest = NSResponseGetObjects.Reader.request(
      new BufferStreamReader(buffer)
    );
    assert(request.currentBlockchainHeight === 346480);
    assert(request.blocks.length === 200);
    assert(!request.txs);
  });
});
