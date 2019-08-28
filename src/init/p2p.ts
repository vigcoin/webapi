import { cryptonote, p2p } from '../config';
import { Configuration } from '../config/types';
import { INetwork, IServerConfig, P2PServer } from '../p2p/index';
import { PeerList, PeerManager } from '../p2p/peer-manager';
import { Handler } from '../p2p/protocol/handler';
import { getBlockChainInitialized } from './blockchain';
import { MemoryPool } from '../cryptonote/mem-pool';
import { getMemoryPool } from './mem-pool';

export const network: INetwork = {
  conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
  connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
  handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
  id: 0, // deprecated config id, should be removed in production
  packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
  pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
  sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
};

export function getDefaultPeerManager(
  whiteLimit: number = p2p.P2P_LOCAL_WHITE_PEERLIST_LIMIT,
  grayLimit: number = p2p.P2P_LOCAL_GRAY_PEERLIST_LIMIT
) {
  const white = new PeerList(whiteLimit);
  const gray = new PeerList(grayLimit);
  return new PeerManager(white, gray);
}

export function getServerConfig(config: Configuration.IConfig): IServerConfig {
  return {
    host: '0.0.0.0',
    port: config.net.p2pPort,
    seedNode: config.seeds,
    // tslint:disable-next-line:object-literal-sort-keys
    isAllowLocalIp: true,
  };
}

export function getHandler(dir: string, config: Configuration.IConfig) {
  const blc = getBlockChainInitialized(dir, config);
  const memPool = getMemoryPool(dir, config);
  return new Handler(blc, memPool);
}

export function getP2PServer(
  dir: string,
  config: Configuration.IConfig
): P2PServer {
  const h = getHandler(dir, config);
  const serverConfig = getServerConfig(config);
  const pm = getDefaultPeerManager();
  return new P2PServer(serverConfig, network, cryptonote.NETWORK_ID, h, pm);
}
