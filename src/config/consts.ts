import * as assert from 'assert';
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
  export const CRYPTONOTE_MAX_TX_SIZE = 1000000000;
  // TODO Currency-specific address prefix
  export const CRYPTONOTE_PUBLIC_ADDRESS_BASE58_PREFIX = 0x3d;

  // TODO: Choose maturity period for your currency
  export const CRYPTONOTE_MINED_MONEY_UNLOCK_WINDOW = 60;
  export const CRYPTONOTE_BLOCK_FUTURE_TIME_LIMIT = 60 * 60 * 2;

  export const BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW = 60;

  // TODO: Define number of blocks for block size median calculation
  export const CRYPTONOTE_REWARD_BLOCKS_WINDOW = 100;
  // Size of block (bytes) after which reward for block calculated using block size
  export const CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE = 10000;

  export const CRYPTONOTE_COINBASE_BLOB_RESERVED_SIZE = 600;

  // Difficulty

  // TODO: Define preferred block's target time

  export const DIFFICULTY_TARGET = 120; // seconds
  export const EXPECTED_NUMBER_OF_BLOCKS_PER_DAY =
    (24 * 60 * 60) / DIFFICULTY_TARGET;
  // TODO: There are options to tune CryptoNote's difficulty retargeting function.
  // TODO: We recommend not to change it.
  export const DIFFICULTY_WINDOW = EXPECTED_NUMBER_OF_BLOCKS_PER_DAY; // blocks
  export const DIFFICULTY_CUT = 60; // timestamps to cut after sorting
  export const DIFFICULTY_LAG = 15;

  assert(
    2 * DIFFICULTY_CUT <= DIFFICULTY_WINDOW - 2,
    'Bad DIFFICULTY_WINDOW or DIFFICULTY_CUT'
  );

  export const MAX_BLOCK_SIZE_INITIAL = 20 * 1024;
  export const MAX_BLOCK_SIZE_GROWTH_SPEED_NUMERATOR = 100 * 1024;
  export const MAX_BLOCK_SIZE_GROWTH_SPEED_DENOMINATOR =
    (365 * 24 * 60 * 60) / DIFFICULTY_TARGET;

  // Transaction related

  export const CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_BLOCKS = 1;
  export const CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_SECONDS =
    DIFFICULTY_TARGET * CRYPTONOTE_LOCKED_TX_ALLOWED_DELTA_BLOCKS;

  export const CRYPTONOTE_DISPLAY_DECIMAL_POINT = 8;

  export const MINIMUM_FEE = 100;
  export const DEFAULT_DUST_THRESHOLD = MINIMUM_FEE;

  export const FUSION_TX_MAX_SIZE =
    (CRYPTONOTE_BLOCK_GRANTED_FULL_REWARD_ZONE * 30) / 100;
  export const FUSION_TX_MIN_INPUT_COUNT = 12;
  export const FUSION_TX_MIN_IN_OUT_COUNT_RATIO = 4;
}
