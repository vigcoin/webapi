import { Configuration } from '@vigcoin/types';
import { IP } from '../../util/ip';

export const data: Configuration.IConfig = {
  name: 'vigcointest',
  // tslint:disable-next-line:object-literal-sort-keys
  createTime: new Date(1520035200000 * 1000),
  block: {
    genesisCoinbaseTxHex:
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101398fb9ec4e76aeef124dfb779de715022efd619e63d7516f8b1470266f5da1fd',
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
    pubKey: '9f80f9a5a434a9f1510d13336228debfee9c918ce505efe225d8c94d045fa126',
    // tslint:disable-next-line:object-literal-sort-keys
    p2pPort: 29800,
    rpcPort: 29801,
    walletPort: 29888,
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  },
  seeds: [
    { port: 19800, ip: IP.toNumber('192.168.9.5') },
    { port: 19800, ip: IP.toNumber('192.168.9.3') },
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
