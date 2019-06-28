import * as assert from 'assert';
import * as path from 'path';
import { P2PStore } from '../../src/p2p/serializer';
import { IP } from '../../src/util/ip';

describe('test peer server', () => {
  const p2pFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin');

  it('should test server serializer', () => {
    const ps = new P2PStore(p2pFile);
    const data = ps.read();
    assert(data.version === 1);
    assert(data.peerManager.version === 1);
    const ips = [];
    for (const item of data.peerManager.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      ips.push(IP.toString(item.peer.ip));
    }
    for (const item of data.peerManager.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      ips.push(IP.toString(item.peer.ip));
    }
  });
});
