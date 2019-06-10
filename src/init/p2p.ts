import { cryptonote, p2p } from '../config';
import { INetworkPeer, IServerConfig, P2PServer } from '../p2p/index';

const config: IServerConfig = {
  host: '127.0.0.1',
  port: 29800,
};

config.isAllowLocalIp = true;

config.seedNode = [
  { port: 19800, host: '69.171.73.252' },
  { port: 19800, host: '39.108.160.252' },
  { port: 19800, host: '144.202.10.183' },
];

const networkPeer: INetworkPeer = {
  id: Math.floor(Math.random() * 10000000000000000),
  network: {
    conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
    connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
    handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
    id: 0,
    packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
    pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
    sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
  },
};

export const server: P2PServer = new P2PServer(
  config,
  networkPeer,
  cryptonote.NETWORK_ID,
  '',
  'p2pstate.bin'
);
