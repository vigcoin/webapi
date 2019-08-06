import { getDefaultPeerManager } from '../../src/init/p2p';

describe('test p2p peer manager', () => {
  it('should get peer manager', () => {
    const pm = getDefaultPeerManager(1);
    const pm1 = getDefaultPeerManager(1, 2);
  });
});
