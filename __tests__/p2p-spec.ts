import { server } from '../src/init/p2p';

describe('test connection', () => {
  beforeEach(() => {
    jest.setTimeout(10000);
  });

  test('Should connect servers', async () => {
    await server.start();
    expect(server).toBeTruthy();
    const peers = server.getPeers();
    expect(peers.length >= 1).toBeTruthy();

    for (const peer of peers) {
      expect(peer.isConnected()).toBeTruthy();
    }
  });

  test('Should stop peers', async () => {
    await server.stop();
  });
});
