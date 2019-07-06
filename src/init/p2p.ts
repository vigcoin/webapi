import { cryptonote, p2p } from '../config';
import { INetworkPeer, IServerConfig, P2PServer } from '../p2p/index';
import { PeerList, PeerManager } from '../p2p/peer-manager';
import { Handler } from '../p2p/protocol/handler';
import { getRandomBytes } from '../util/bytes';
import { getBlockFile } from '../util/fs';
import { IP } from '../util/ip';
import { getBlockChain } from './blockchain';

const config: IServerConfig = {
  host: '127.0.0.1',
  port: 29800,
};

config.isAllowLocalIp = true;

config.seedNode = [
  { port: 19800, ip: IP.toNumber('69.171.73.252') },
  { port: 19800, ip: IP.toNumber('78.141.199.140') },
  { port: 19800, ip: IP.toNumber('47.91.226.168') },
  // { port: 19800, ip: IP.toNumber('39.108.160.252') },  // deprecated
  // { port: 19800, ip: IP.toNumber("144.202.10.183") }   // deprecated
];

export const getRandomPeerId = getRandomBytes;

const networkPeer: INetworkPeer = {
  id: getRandomPeerId(),
  network: {
    conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
    connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
    handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
    id: 0, // deprecated config id, should be removed in production
    packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
    pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
    sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
  },
};

const white = new PeerList(p2p.P2P_LOCAL_WHITE_PEERLIST_LIMIT);
const gray = new PeerList(p2p.P2P_LOCAL_GRAY_PEERLIST_LIMIT);

const pm = new PeerManager(white, gray);

const bc = getBlockChain();
bc.init();

const handler = new Handler(bc);

export const server: P2PServer = new P2PServer(
  config,
  // networkPeer,
  cryptonote.NETWORK_ID,
  // '',
  // 'p2pstate.bin'
  handler,
  pm
);

export function getP2PServer(dir: string): P2PServer {
  const blc = getBlockChain(getBlockFile(dir));
  blc.init();
  const h = new Handler(blc);
  return new P2PServer(config, cryptonote.NETWORK_ID, h, pm);
}
