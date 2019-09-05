export const p2p = {
  P2P_CONNECTION_MAX_WRITE_BUFFER_SIZE: 16 * 1024 * 1024,
  P2P_DEFAULT_CONNECTIONS_COUNT: 8,
  P2P_DEFAULT_CONNECTION_TIMEOUT: 5000,
  P2P_DEFAULT_HANDSHAKE_INTERVAL: 60,
  P2P_DEFAULT_HANDSHAKE_INVOKE_TIMEOUT: 5000,
  P2P_DEFAULT_INVOKE_TIMEOUT: 60 * 2 * 1000,
  P2P_DEFAULT_PACKET_MAX_SIZE: 50000000,
  P2P_DEFAULT_PEERS_IN_HANDSHAKE: 250,
  P2P_DEFAULT_PING_CONNECTION_TIMEOUT: 2000,
  P2P_DEFAULT_WHITELIST_CONNECTIONS_PERCENT: 70,
  P2P_LOCAL_GRAY_PEERLIST_LIMIT: 5000,
  P2P_LOCAL_WHITE_PEERLIST_LIMIT: 1000,
};

export const cryptonote = {
  NETWORK_ID: [
    0x43,
    0x52,
    0x59,
    0x50,
    0x54,
    0x4f,
    0x4e,
    0x43,
    0xf4,
    0xe5,
    0x30,
    0xc2,
    0xb0,
    0x19,
    0x01,
    0x10,
  ],
};

// tslint:disable-next-line:no-namespace
export namespace parameters {
  export const CRYPTONOTE_MAX_BLOCK_NUMBER = 500000000;
  export const CRYPTONOTE_MAX_BLOCK_BLOB_SIZE = 500000000;

  // TODO: Define number of blocks for block size median calculation
  export const CRYPTONOTE_REWARD_BLOCKS_WINDOW = 100;
  // Size of block (bytes) after which reward for block calculated using block size
  export const CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE = 10000;

  export const CRYPTONOTE_COINBASE_BLOB_RESERVED_SIZE = 600;
  export const CRYPTONOTE_MAX_TX_SIZE = 1000000000;

  export const CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = 0x3d;

  export const MINIMUM_FEE = 100;
  export const DEFAULT_DUST_THRESHOLD = MINIMUM_FEE;

  export const FUSION_TX_MAX_SIZE =
    (CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE * 30) / 100;
  export const FUSION_TX_MIN_INPUT_COUNT = 12;
  export const FUSION_TX_MIN_IN_OUT_COUNT_RATIO = 4;
}