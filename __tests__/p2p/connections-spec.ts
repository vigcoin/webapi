import * as assert from 'assert';
import { p2p } from '../../src/config';
import { INetwork, IPeer } from '../../src/p2p';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { IP } from '../../src/util/ip';

describe('test connections', () => {
  it('should connect to peer', async () => {
    // const host = '250.167.157.123';
    // const port = 19800;

    const host = '69.171.73.252';
    const port = 19800;
    const peer: IPeer = {
      port,
      // tslint:disable-next-line:object-literal-sort-keys
      ip: IP.toNumber(host),
    };
    const network: INetwork = {
      conectionTimeout: p2p.P2P_DEFAULT_CONNECTION_TIMEOUT,
      connectionsCount: p2p.P2P_DEFAULT_CONNECTIONS_COUNT,
      handshakeInterval: p2p.P2P_DEFAULT_HANDSHAKE_INTERVAL,
      id: 0, // deprecated config id, should be removed in production
      packageMaxSize: p2p.P2P_DEFAULT_PACKET_MAX_SIZE,
      pingConnectionTimeout: p2p.P2P_DEFAULT_PING_CONNECTION_TIMEOUT,
      sendPeerListSize: p2p.P2P_DEFAULT_PEERS_IN_HANDSHAKE,
    };
    let caught = false;
    try {
      const socket = await P2pConnectionContext.createConnection(peer, network);
      socket.destroy();
    } catch (e) {
      caught = true;
    }
    assert(!caught);
  });
});
