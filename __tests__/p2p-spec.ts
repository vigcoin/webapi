import { server } from '../src/init/p2p';

describe('test connection', () => {
  beforeEach(() => {
    jest.setTimeout(10000);
  });

  test('Should connect servers', async () => {
    await server.start();
    expect(server).toBeTruthy();
    const peers = server.getPeers();
    expect(peers.white.length >= 1).toBeTruthy();
    expect(peers.gray.length >= 1).toBeTruthy();
  });

  test('Should stop peers', async () => {
    await server.stop();
  });
});
