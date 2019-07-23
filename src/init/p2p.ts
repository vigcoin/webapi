import { cryptonote, p2p } from '../config';
import { Configuration } from '../config/types';
import { INetwork, IServerConfig, P2PServer } from '../p2p/index';
import { PeerList, PeerManager } from '../p2p/peer-manager';
import { Handler } from '../p2p/protocol/handler';
import { getBlockFile, getDefaultAppDir } from '../util/fs';
import { IP } from '../util/ip';
import { getBlockChain } from './blockchain';

export const network: INetwork = {
  conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
  connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
  handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
  id: 0, // deprecated config id, should be removed in production
  packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
  pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
  sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
};

const white = new PeerList(p2p.P2P_LOCAL_WHITE_PEERLIST_LIMIT);
const gray = new PeerList(p2p.P2P_LOCAL_GRAY_PEERLIST_LIMIT);

export const pm = new PeerManager(white, gray);

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
  const files: Configuration.IBlockFile = getBlockFile(dir, config);
  const currency: Configuration.ICurrency = {
    block: {
      genesisCoinbaseTxHex: config.block.genesisCoinbaseTxHex,
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    },
    blockFiles: files,
    hardfork: [],
  };
  const blc = getBlockChain(currency);
  blc.init();
  return new Handler(blc);
}

export function getP2PServer(
  dir: string,
  config: Configuration.IConfig
): P2PServer {
  const h = getHandler(dir, config);
  const serverConfig = getServerConfig(config);
  return new P2PServer(serverConfig, network, cryptonote.NETWORK_ID, h, pm);
}
