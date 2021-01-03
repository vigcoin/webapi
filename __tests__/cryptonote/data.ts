import { Configuration } from '@vigcoin/types';
import * as assert from 'assert';
import * as path from 'path';

// tslint:disable-next-line:no-namespace
export namespace haveFiles {
  const indexFile = path.resolve(__dirname, '../vigcoin/blockindexes.dat');
  const blockFile = path.resolve(__dirname, '../vigcoin/blocks.dat');
  const chainFile = path.resolve(__dirname, '../vigcoin/blockchainindices.dat');
  const cacheFile = path.resolve(__dirname, '../vigcoin/blockscache.dat');

  export const files: Configuration.ICBlockFile = {
    data: blockFile,
    index: indexFile,
    // tslint:disable-next-line:object-literal-sort-keys
    chain: chainFile,
    cache: cacheFile,
  };
}

// tslint:disable-next-line:no-namespace
export namespace emptyFiles {
  const indexFile = path.resolve(__dirname, '../vigcoinempty/blockindexes.dat');
  const blockFile = path.resolve(__dirname, '../vigcoinempty/blocks.dat');
  const chainFile = path.resolve(
    __dirname,
    '../vigcoinempty/blockchainindices.dat'
  );
  const cacheFile = path.resolve(__dirname, '../vigcoinempty/blockscache.dat');

  export const files: Configuration.ICBlockFile = {
    data: blockFile,
    index: indexFile,
    // tslint:disable-next-line:object-literal-sort-keys
    chain: chainFile,
    cache: cacheFile,
  };
}

describe('test raw block', () => {
  it('should have files', () => {
    assert(haveFiles.files);
    assert(emptyFiles.files);
  });
});
