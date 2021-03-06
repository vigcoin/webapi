import { unlinkSync } from 'fs';
import * as path from 'path';
import { MemoryPool } from '../../src/cryptonote/mem-pool';
import { data } from '../../src/init/net-types/testnet';

describe('test memory pool', () => {
  it('should init without file', () => {
    const filename = path.resolve(
      __dirname,
      '../vigcoin/' + data.extFiles.pool + '.null'
    );
    const memPool = new MemoryPool(filename);
    memPool.init();
    unlinkSync(filename);
  });

  it('should init', () => {
    const filename = path.resolve(
      __dirname,
      '../vigcoin/' + data.extFiles.pool
    );
    const memPool = new MemoryPool(filename);
    memPool.init();
  });

  it('should init with riched data', () => {
    const filename = path.resolve(
      __dirname,
      '../vigcoin/' + data.extFiles.pool + '.full'
    );
    const memPool = new MemoryPool(filename);
    memPool.init();
  });
});
