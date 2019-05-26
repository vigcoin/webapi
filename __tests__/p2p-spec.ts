import { server } from "../src/p2p/init"

describe("test connection", () => {
  beforeEach(() => {
    jest.setTimeout(10000);
  });

  test('Should connect servers', async () => {
    await server.start();
    expect(server).toBeTruthy();
    const peers = server.getPeers();
    expect(peers.length).toBe(3);

    for (const peer of peers) {
      expect(peer.isConnected()).toBeTruthy();
    }
  });

  test('Should stop peers', async () => {
    await server.stop();
  });
});


