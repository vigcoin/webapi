import { Configuration } from '@vigcoin/types';
import { IP } from '@vigcoin/util';

export const data: Configuration.IConfig = {
  name: 'vigcoin',
  // tslint:disable-next-line:object-literal-sort-keys
  createTime: new Date(1520035200000 * 1000),
  block: {
    genesisCoinbaseTxHex:
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101a9a4569f7e10164a32324b2b878ae32d98be0949ce6e0150ba1d7e54d60969e5',
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  },
  transaction: {
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  },
  net: {
    pubKey: '8f80f9a5a434a9f1510d13336228debfee9c918ce505efe225d8c94d045fa115',
    // tslint:disable-next-line:object-literal-sort-keys
    p2pPort: 19800,
    rpcPort: 19801,
    walletPort: 19888,
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  },
  seeds: [
    { port: 19800, ip: IP.toNumber('69.171.73.252') },
    { port: 19800, ip: IP.toNumber('78.141.199.140') },
    { port: 19800, ip: IP.toNumber('47.91.226.168') },
  ],
  checkpoints: [],
  hardforks: [
    {
      version: 1,
      // tslint:disable-next-line:object-literal-sort-keys
      height: 1,
      threshold: 0,
      time: new Date(1341378000 * 1000),
    },
    {
      version: 7,
      // tslint:disable-next-line:object-literal-sort-keys
      height: 198000,
      threshold: 0,
      time: new Date(1547693038060 * 1000),
    },
  ],
  storageVersions: {
    blockCacheArchive: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    blockCacheIndicesArchive: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  },
  blockFiles: {
    data: 'blocks.dat',
    index: 'blockindexes.dat',
    // tslint:disable-next-line:object-literal-sort-keys
    cache: 'blockcache.dat',
    chain: 'blockchainindices.dat',
  },
  extFiles: {
    pool: 'poolstate.bin',
    // tslint:disable-next-line:object-literal-sort-keys
    p2p: 'p2pstate.bin',
    miner: 'miner_conf.json',
  },
};
