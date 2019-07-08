import { Command } from 'commander';
import { getType, getConfigByType } from '../init/cryptonote';
import { Config } from '../p2p/config';

const commander = new Command();

commander.version(Config.VERSION);
commander
  .option(
    '-t, --testnet',
    'Deploy test net. Checkpoints and hardcoded seeds are ignored, ',
    false
  )
  .option('--p2p-bind-ip <ip>', 'Interface for p2p network protocol', '0.0.0.0')
  .option('--p2p-bind-port <ip>', 'Port for p2p network protocol')
  .option(
    '--p2p-external-port <port>',
    'External port for p2p network protocol (if port forwarding used with NAT)',
    0
  )
  .option(
    '--allow-local-ip',
    'Allow local ip add to peer list, mostly in debug purposes'
  )
  .option('add-peer', 'Manually add peer to local peerlist')
  .option(
    '--add-priority-node <nodes>',
    'Specify list of peers to connect to and attempt to keep the connection open'
  )
  .option(
    '--add-exclusive-node <nodes>',
    'Specify list of peers to connect to only.\nIf this option is given the options add-priority-node and seed-node are ignored'
  )
  .option(
    '--seed-node <nodes>',
    'Connect to a node to retrieve peer addresses, and disconnect'
  )
  .option(
    '--hide-my-port',
    'Do not announce yourself as peerlist candidate',
    true
  )
  .option('--rpc-bind-port <port>', 'Specify rpc port')
  .option('--config-file <file>', 'Specify configuration file')
  .option('--data-dir <dir>', 'Specify data directory');
commander.parse(process.argv);
console.log(commander);
const config = getConfigByType(getType(!!commander.testnet));
// if (commander.bind) console.log(type);
