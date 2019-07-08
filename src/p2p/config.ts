import { Command } from 'commander';
import { Configuration } from '../config/types';
import { IPeer, IPeerEntry } from '../cryptonote/p2p';
import { uint16 } from '../cryptonote/types';
import { IP } from '../util/ip';
import { ConnectionContext } from './connection';

export class Config {
  // p2p cli version
  public static VERSION = '0.1.0';

  private testnet: boolean = false;
  private p2pBindIp: string = '0.0.0.0';
  private p2pBindPort: uint16 = 0;
  private p2pExternalPort: uint16 = 0;
  private allowLocalIP: boolean = false;
  // private peers: IPeerEntry[] = [];
  private priorityNodes: IPeer[] = [];
  private exclusiveNodes: IPeer[] = [];
  private seedNodes: IPeer[] = [];
  private hideMyPort: boolean = false;
  private dataDir: string = '';
  private filename: string = '';

  private config: Configuration.IConfig;

  constructor(config: Configuration.IConfig) {
    this.config = config;
  }

  public init(cmd: Command) {
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
    for (const key of nodeKeys) {
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
}
