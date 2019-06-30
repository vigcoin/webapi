import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { LevinProtocol } from '../../src/p2p/levin';
import { ping, timedsync } from '../../src/p2p/protocol';
import {
  kvHeader,
  pingRequest,
  timesyncRequest,
  handshakeRequest,
} from './data';

describe('test levin protocol', () => {
  it('should read header', () => {
    const reader = new BufferStreamReader(Buffer.from(kvHeader));
    const header = LevinProtocol.readHeader(reader);
    assert(header.size === 187);
    assert(header.command === 1001);
    assert(header.flags === 1);
    assert(header.reply === true);
    assert(header.version === 1);
    assert(header.code === 0);
  });

  it('should read zero size levin', () => {
    const reader = new BufferStreamReader(Buffer.from(pingRequest));
    const cmd = LevinProtocol.readCommand(reader);
    assert(cmd.command === 1003);
    assert(cmd.isNotify === false);
    assert(cmd.isResponse === false);
    assert(cmd.buffer.length === 10);
  });

  it('should handle levin ping request protocol', done => {
    let processed = false;
    const server = createServer(socket => {
      const context = new P2pConnectionContext(socket);
      const levin = new LevinProtocol(socket, context);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      // 'connect' listener
      client.write(Buffer.from(pingRequest));
      const context = new P2pConnectionContext(client);
      const levin = new LevinProtocol(client, context);
      levin.on('ping', (res: ping.IResponse) => {
        assert(String(res.status) === 'OK');
        assert(processed);
        client.destroy();
        server.close();
        done();
      });
    });
  });

  it('should handle levin timedsync protocol', done => {
    let processed = false;
    const server = createServer(socket => {
      const context = new P2pConnectionContext(socket);
      const levin = new LevinProtocol(socket, context);
      levin.on('processed', message => {
        assert(message === 'timedsync');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      client.write(Buffer.from(timesyncRequest));
      const context = new P2pConnectionContext(client);
      const levin = new LevinProtocol(client, context);
      levin.on('timedsync', (res: timedsync.IResponse) => {
        assert(!!res.localTime);
        assert(processed);
        client.destroy();
        server.close();
        done();
      });
    });
  });

  // it('should handle levin handshake protocol', done => {
  //   let processed = false;
  //   const server = createServer(socket => {
  //     const context = new P2pConnectionContext(socket);
  //     const levin = new LevinProtocol(socket, context);
  //     levin.on('processed', message => {
  //       assert(message === 'handshake');
  //       processed = true;
  //     });
  //   });
  //   const port = Math.floor(Math.random() * 1000) + 1024;
  //   server.listen(port);
  //   const client = createConnection({ port }, () => {
  //     client.write(Buffer.from(handshakeRequest));
  //     const context = new P2pConnectionContext(client);
  //     const levin = new LevinProtocol(client, context);
  //     levin.on('handshake', (res: timedsync.IResponse) => {
  //       assert(!!res.localTime);
  //       assert(processed);
  //       client.destroy();
  //       server.close();
  //       done();
  //     });
  //   });
  // });
});
