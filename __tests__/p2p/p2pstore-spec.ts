import * as assert from 'assert';
import { readFileSync, unlinkSync } from 'fs';
import * as path from 'path';
import { getP2PServer } from '../../src/init/p2p';
import { PeerList, PeerManager } from '../../src/p2p/peer-manager';
import { P2PStore } from '../../src/p2p/serializer';
import { IP } from '../../src/util/ip';

import { data } from '../../src/init/net-types/testnet';

const server = getP2PServer(path.resolve(__dirname, '../vigcoin'), data);
describe('test peer server', () => {
  const p2pFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin');
  const p2pFile1 = path.resolve(__dirname, '../vigcoin/p2pstate.bin.new');
  const outFile = path.resolve(__dirname, '../vigcoin/p2pstate.bin.out');

  let whiteList;
  let grayList;
  let peerId;

  it('should getStore with a file', () => {
    const whitePeerList = new PeerList(100);
    const grayPeerList = new PeerList(100);
    const pm = new PeerManager(whitePeerList, grayPeerList);
    const store = P2PStore.getStore(p2pFile, server, pm);
    assert(store);
  });

  it('should read p2p state file 1', () => {
    const ps = new P2PStore(p2pFile);
    const whitePeerList = new PeerList(100);
    const grayPeerList = new PeerList(100);
    const pm = new PeerManager(whitePeerList, grayPeerList);

    ps.read(server, pm);
    assert(server.version === 1);
    assert(pm.version === 1);
    const white = [];
    whiteList = pm.white;
    for (const item of pm.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      white.push(IP.toString(item.peer.ip));
    }
    const gray = [];
    grayList = pm.gray;

    for (const item of pm.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      gray.push(IP.toString(item.peer.ip));
    }
    peerId = server.id;
  });

  it('should write p2p state file 1', () => {
    const ps = new P2PStore(outFile);
    const whitePeerList = new PeerList(100);
    const grayPeerList = new PeerList(100);
    const pm = new PeerManager(whitePeerList, grayPeerList);
    whitePeerList.peers = whiteList;
    grayPeerList.peers = grayList;
    server.id = peerId;
    ps.write(server, pm);
    ps.read(server, pm);
    assert(server.version === 1);
    assert(pm.version === 1);
    assert(pm.white.length === whitePeerList.peers.length);
    assert(pm.gray.length === grayPeerList.peers.length);
    const origin = readFileSync(p2pFile);
    const out = readFileSync(outFile);
    assert(origin.equals(out));
    unlinkSync(outFile);
    const length = pm.gray.length;
    pm.merge(pm.gray);
    assert(pm.gray.length === length);
    pm.merge(pm.white);
    assert(pm.gray.length > length);
  });

  it('should read p2p state file ', () => {
    const ps = new P2PStore(p2pFile1);
    const whitePeerList = new PeerList(100);
    const grayPeerList = new PeerList(100);
    const pm = new PeerManager(whitePeerList, grayPeerList);
    ps.read(server, pm);
    assert(server.version === 1);
    assert(pm.version === 1);
    const white = [];
    for (const item of pm.white) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      white.push(IP.toString(item.peer.ip));
    }
    const gray = [];
    for (const item of pm.gray) {
      IP.toString(item.peer.ip);
      assert(item.peer.port === 19800);
      gray.push(IP.toString(item.peer.ip));
    }
  });
});
