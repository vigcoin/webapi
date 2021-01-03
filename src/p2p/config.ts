import { IPeer, IPeerEntry, uint16 } from '@vigcoin/types';
import { IP } from '../util/ip';
import { ConnectionContext } from './connection';

export class P2PConfig {
  // p2p cli version
  public static VERSION = '0.1.0';

  public testnet: boolean = false;
  public p2pBindIp: string = '0.0.0.0';
  public p2pBindPort: uint16 = 0;
  public p2pExternalPort: uint16 = 0;
  public allowLocalIp: boolean = false;
  public peers: IPeerEntry[] = [];
  public priorityNodes: IPeer[] = [];
  public exclusiveNodes: IPeer[] = [];
  public seedNodes: IPeer[] = [];
  public hideMyPort: boolean = false;
  public dataDir: string = '';
  public filename: string = '';

  public init(cmd) {
    const keys = [
      'p2pBindIp',
      'allowLocalIp',
      'hideMyPort',
      'p2pBindPort',
      'p2pExternalPort',
      'dataDir',
    ];
    for (const key of keys) {
      if (cmd[key]) {
        this[key] = cmd[key];
      }
    }
    IP.allowLocalIP = this.allowLocalIp;
    const nodeKeys = [
      { name: 'priorityNodes', value: 'addPriorityNode' },
      { name: 'exclusiveNodes', value: 'addExclusiveNode' },
      { name: 'seedNodes', value: 'seedNode' },
    ];
    for (const key of nodeKeys) {
      if (cmd[key.value]) {
        this[key.name] = this.parseNode(cmd[key.value]);
      }
    }

    const peerKeys = [{ name: 'peers', value: 'addPeer' }];
    for (const key of peerKeys) {
      if (cmd[key.value]) {
        this[key.name] = this.parsePeer(cmd[key.value]);
      }
    }
  }

  public parsePeer(peerStr: string): IPeerEntry[] {
    const peers = peerStr.split(',');
    const list: IPeerEntry[] = [];
    for (const peer of peers) {
      const pair = peer.split(':');
      const ip = IP.toNumber(pair[0] + '');
      const port = parseInt(pair[1], 10);
      list.push({
        id: ConnectionContext.randomId(),
        lastSeen: new Date(),
        peer: { port, ip },
      });
    }
    return list;
  }

  public parseNode(peerStr: string) {
    const peers = peerStr.split(',');
    const list: IPeer[] = [];
    for (const peer of peers) {
      const pair = peer.split(':');
      const ip = IP.toNumber(pair[0] + '');
      const port = parseInt(pair[1], 10);
      list.push({ port, ip });
    }
    return list;
  }

  public getMyPort(): number {
    if (this.hideMyPort) {
      return 0;
    }
    if (this.p2pExternalPort) {
      return this.p2pExternalPort;
    }

    return this.p2pBindPort;
  }
}
