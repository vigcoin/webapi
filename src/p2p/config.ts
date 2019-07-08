import { Command } from 'commander';
import { IPeer, IPeerEntry } from '../cryptonote/p2p';
import { uint16 } from '../cryptonote/types';

export class Config {
  // p2p cli version
  public static VERSION = '0.1.0';

  private bindIP: string = '';
  private bindPort: uint16 = 0;
  private exteralPort: uint16 = 0;
  private allowLocalIP: boolean = false;
  private peers: IPeerEntry[] = [];
  private priorityNodes: IPeer[] = [];
  private exclusiveNodes: IPeer[] = [];
  private seedNodes: IPeer[] = [];
  private hideMyPort: boolean = false;
  private folder: string = '';
  private filename: string = '';
}
