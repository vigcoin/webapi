import { randomBytes } from 'crypto';
import { createConnection, createServer } from 'net';
import { getDefaultPeerManager } from '../../../src/init/p2p';
import { P2pConnectionContext } from '../../../src/p2p/connection';
import { handshake } from '../../../src/p2p/protocol/commands/handshake';
import { ping } from '../../../src/p2p/protocol/commands/ping';

const pm = getDefaultPeerManager();

describe('test p2p ping', () => {
  it('should handle onTry', done => {
    const peerId = randomBytes(32);
    const response: ping.IResponse = {
      peerId,
      status: ping.PING_OK_RESPONSE_STATUS_TEXT,
    };
    const data: handshake.IRequest = {
      node: {
        localTime: new Date(),
        myPort: 1000,
        networkId: [12, 23],
        peerId,
        version: 1,
      },
      payload: {
        currentHeight: 1000,
        hash: randomBytes(32),
      },
    };
    const server = createServer(socket => {
      socket.on('data', () => {
        // process here
      });
    });

    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const context = new P2pConnectionContext(client);
      ping.Handler.onTry(response, data, context, pm);
      response.status = '00';
      ping.Handler.onTry(response, data, context, pm);
      response.status = ping.PING_OK_RESPONSE_STATUS_TEXT;
      response.peerId = randomBytes(32);
      ping.Handler.onTry(response, data, context, pm);
      client.destroy();
      server.close();
      done();
    });
  });
});
