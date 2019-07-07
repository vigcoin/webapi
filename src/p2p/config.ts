import { Command } from 'commander';
import { IPeer, IPeerEntry } from '../cryptonote/p2p';
import { uint16 } from '../cryptonote/types';
import { getConfigByType, getType } from '../init/cryptonote';

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
  private commander: Command;

  constructor() {
    this.commander = new Command();
    this.commander.version(Config.VERSION);
  }

  public initOptions() {
    const config = getConfigByType(getType(process.argv));
    const net = config.net;
    this.commander
      .option('p2p-bind-ip', 'Interface for p2p network protocol', '0.0.0.0')
      .option('p2p-bind-port', 'Port for p2p network protocol', net.p2pPort)
      .option(
        'p2p-external-port',
        'External port for p2p network protocol (if port forwarding used with NAT)',
        0
      )
      .option(
        'allow-local-ip',
        'Allow local ip add to peer list, mostly in debug purposes'
      )
      .option('add-peer', 'Manually add peer to local peerlist')
      .option(
        'add-priority-node',
        'Specify list of peers to connect to and attempt to keep the connection open'
      )
      .option(
        'add-exclusive-node',
        'Specify list of peers to connect to only.\nIf this option is given the options add-priority-node and seed-node are ignored'
      )
      .option(
        'seed-node',
        'Connect to a node to retrieve peer addresses, and disconnect'
      )
      .option(
        'hide-my-port',
        'Do not announce yourself as peerlist candidate',
        true
      )
      .option('rpc-bind-port', '', net.rpcPort)
      .option(
        'config-file',
        'Specify configuration file',
        config.name + '.conf'
      )
      .option('data-dir', 'Specify data directory');
  }
}
