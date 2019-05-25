import { IConfig, Server } from '../src/p2p/index';

const config: IConfig = {
  address: '127.0.0.1',
  port: 19800,
};
config.isAllowLocalIp = true;
config.seedNode = [
  { port: 19800, host: '69.171.73.252' },
  { port: 19800, host: '39.108.160.252' },
  { port: 19800, host: '144.202.10.183' }
];

const server: Server = new Server(config, '', 'p2pstate.bin');

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
      peer.stop();
    }
  });
});


