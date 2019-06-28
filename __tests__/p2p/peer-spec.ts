import * as assert from 'assert';
import { IPeerEntry } from '../../src/cryptonote/p2p';
import { PeerList, PeerManager } from '../../src/p2p/peer-manager';
import { IP } from '../../src/util/ip';

describe('test peer', () => {
  const pe = [
    {
      lastSeen: new Date(),
      peer: {
        port: 1080,
        // tslint:disable-next-line:object-literal-sort-keys
        ip: IP.toNumber('127.0.0.1'),
      },
      // tslint:disable-next-line:object-literal-sort-keys
      id: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]),
    },
    {
      lastSeen: new Date(),
      peer: {
        port: 1081,
        // tslint:disable-next-line:object-literal-sort-keys
        ip: IP.toNumber('127.0.0.1'),
      },
      // tslint:disable-next-line:object-literal-sort-keys
      id: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]),
    },
    {
      lastSeen: new Date(),
      peer: {
        port: 1080,
        // tslint:disable-next-line:object-literal-sort-keys
        ip: IP.toNumber('192.168.0.1'),
      },
      // tslint:disable-next-line:object-literal-sort-keys
      id: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]),
    },
    {
      lastSeen: new Date(),
      peer: {
        port: 1081,
        // tslint:disable-next-line:object-literal-sort-keys
        ip: IP.toNumber('192.168.0.1'),
      },
      // tslint:disable-next-line:object-literal-sort-keys
      id: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]),
    },
    {
      lastSeen: new Date(),
      peer: {
        port: 1081,
        // tslint:disable-next-line:object-literal-sort-keys
        ip: IP.toNumber('8.8.8.8'),
      },
      // tslint:disable-next-line:object-literal-sort-keys
      id: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]),
    },
    {
      lastSeen: new Date(),
      peer: {
        port: 2081,
        // tslint:disable-next-line:object-literal-sort-keys
        ip: IP.toNumber('9.8.8.8'),
      },
      // tslint:disable-next-line:object-literal-sort-keys
      id: Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]),
    },
  ];

  it('should test PeerList', () => {
    const pl = new PeerList(2);
    pl.append(pe[0]);
    pl.append(pe[1]);

    assert(pl.size === 2);
    pl.append(pe[1]);
    assert(pl.size === 2);
    pl.remove(pe[1]);
    assert(pl.size === 1);
    pl.append(pe[1]);
    pl.append(pe[2]);
    assert(pl.size === 2);
    assert(pl.find(pe[0]) === -1);
    assert(pl.find(pe[1]) === 0);
    pl.append(pe[3]);
    assert(pl.find(pe[1]) === -1);
  });

  it('should test PeerManager', () => {
    const white = new PeerList(2);
    const gray = new PeerList(2);
    const pm = new PeerManager(white, gray);
    pm.appendWhite(pe[0]);
    pm.appendGray(pe[1]);
    pm.appendWhite(pe[1]);
    pm.appendGray(pe[1]);
    pm.appendWhite(pe[2]);
    pm.appendWhite(pe[3]);
    pm.appendGray(pe[0]);
    pm.appendGray(pe[4]);
    pm.appendWhite(pe[4]);
    pm.appendGray(pe[4]);
    pm.appendWhite(pe[5]);
    gray.remove(pe[4]);
    gray.remove(pe[3]);
    gray.remove(pe[5]);
    white.remove(pe[5]);
  });
});
