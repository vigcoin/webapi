import * as assert from 'assert';
import { readFileSync, unlinkSync } from 'fs';
import * as path from 'path';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import { server } from '../../src/init/p2p';
import { PeerList, PeerManager } from '../../src/p2p/peer-manager';
import { P2PStore } from '../../src/p2p/serializer';
import { IP } from '../../src/util/ip';

describe('test peer server', () => {
  const p2pFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin');
  const p2pFile1 = path.resolve(__dirname, '../vigcoin/p2pstate.bin.new');
  const outFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin.out');

  let whiteList;
  let grayList;
  let peerId;

  it('should read p2p state file 1', () => {
    const ps = new P2PStore(p2pFile);
    const data = ps.read();
    peerId = data.peerId;
    assert(data.version === 1);
    assert(data.peerManager.version === 1);
    const white = [];
    whiteList = data.peerManager.white;
    for (const item of data.peerManager.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      white.push(IP.toString(item.peer.ip));
    }
    const gray = [];
    grayList = data.peerManager.gray;

    for (const item of data.peerManager.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      gray.push(IP.toString(item.peer.ip));
    }
  });
  it('should write p2p state file 1', () => {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    const ps = new P2PStore(outFile);
    const whitePeerList = new PeerList(100);
    const grayPeerList = new PeerList(100);
    whitePeerList.peers = whiteList;
    grayPeerList.peers = grayList;
    server.id = peerId;
    ps.write(server, new PeerManager(whitePeerList, grayPeerList));
    const pe = ps.read();
    assert(pe.version === 1);
    assert(pe.peerManager.version === 1);
    assert(pe.peerManager.white.length === whitePeerList.peers.length);
    assert(pe.peerManager.gray.length === grayPeerList.peers.length);
    const origin = readFileSync(p2pFile);
    const out = readFileSync(outFile);
    assert(origin.equals(out));
    unlinkSync(outFile);
  });

  it('should read p2p state file ', () => {
    const ps = new P2PStore(p2pFile1);
    const data = ps.read();
    assert(data.version === 1);
    assert(data.peerManager.version === 1);
    const white = [];
    for (const item of data.peerManager.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      white.push(IP.toString(item.peer.ip));
    }
    const gray = [];
    for (const item of data.peerManager.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      gray.push(IP.toString(item.peer.ip));
    }
  });
});
