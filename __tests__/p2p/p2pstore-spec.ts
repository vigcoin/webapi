import * as assert from 'assert';
import * as path from 'path';
import { P2PStore } from '../../src/p2p/serializer';
import { IP } from '../../src/util/ip';

describe('test peer server', () => {
  const p2pFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin');
  const p2pFile1 = path.resolve(__dirname, '../vigcoin/p2pstate.bin.new');
  const outFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin.out');

  it('should test server serializer', () => {
    const ps = new P2PStore(p2pFile);
    const data = ps.read();
    assert(data.version === 1);
    assert(data.peerManager.version === 1);
    const white = [];
    for (const item of data.peerManager.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      white.push(IP.toString(item.peer.ip));
      console.log(item.lastSeen);
    }
    console.log('white', white);
    const gray = [];

    for (const item of data.peerManager.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      gray.push(IP.toString(item.peer.ip));
      console.log(item.lastSeen);
    }
    console.log('gray', gray);
  });

  it('should test server serializer', () => {
    const ps = new P2PStore(p2pFile1);
    const data = ps.read();
    assert(data.version === 1);
    assert(data.peerManager.version === 1);
    const white = [];
    for (const item of data.peerManager.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      white.push(IP.toString(item.peer.ip));
      console.log(item.lastSeen);
    }
    console.log('white', white);
    const gray = [];

    for (const item of data.peerManager.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      gray.push(IP.toString(item.peer.ip));
      console.log(item.lastSeen);
    }
    console.log('gray', gray);
  });
});
