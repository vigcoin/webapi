import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { LevinProtocol } from '../../src/p2p/levin';
import { timedsync } from '../../src/p2p/protocol';

describe('test levin protocol', () => {
  it('should read header', () => {
    const data = [
      0x01,
      0x21,
      0x01,
      0x01,
      0x01,
      0x01,
      0x01,
      0x01,
      0xbb,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0xe9,
      0x03,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
    ];
    const reader = new BufferStreamReader(Buffer.from(data));
    const header = LevinProtocol.readHeader(reader);
    assert(header.size === 187);
    assert(header.command === 1001);
    assert(header.flags === 1);
    assert(header.reply === true);
    assert(header.version === 1);
    assert(header.code === 0);
  });

  let pingRequest = [];
  it('should read zero size levin', () => {
    pingRequest = [
      0x01,
      0x21,
      0x01,
      0x01,
      0x01,
      0x01,
      0x01,
      0x01,
      0x0a,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0xeb,
      0x03,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x00,
      0x00,
      0x00,
      0x01,
      0x11,
      0x01,
      0x01,
      0x01,
      0x01,
      0x02,
      0x01,
      0x01,
      0x00,
    ];
    const reader = new BufferStreamReader(Buffer.from(pingRequest));
    const cmd = LevinProtocol.readCommand(reader);
    assert(cmd.command === 1003);
    assert(cmd.isNotify === false);
    assert(cmd.isResponse === false);
    assert(cmd.buffer.length === 10);
  });

  it('should handle levin ping request protocol', done => {
    const server = createServer(socket => {
      const context = new P2pConnectionContext(socket);
      const levin = new LevinProtocol(socket, context);
      levin.on('processed', message => {
        assert(message === 'ping');
        socket.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      // 'connect' listener
      client.write(Buffer.from(pingRequest));
    });
  });

  const timesyncRequest = [
    0x01,
    0x21,
    0x01,
    0x01,
    0x01,
    0x01,
    0x01,
    0x01,
    0x56,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x01,
    0xea,
    0x03,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01,
    0x11,
    0x01,
    0x01,
    0x01,
    0x01,
    0x02,
    0x01,
    0x01,
    0x04,
    0x0c,
    0x70,
    0x61,
    0x79,
    0x6c,
    0x6f,
    0x61,
    0x64,
    0x5f,
    0x64,
    0x61,
    0x74,
    0x61,
    0x0c,
    0x08,
    0x0e,
    0x63,
    0x75,
    0x72,
    0x72,
    0x65,
    0x6e,
    0x74,
    0x5f,
    0x68,
    0x65,
    0x69,
    0x67,
    0x68,
    0x74,
    0x06,
    0x02,
    0x9d,
    0x04,
    0x00,
    0x06,
    0x74,
    0x6f,
    0x70,
    0x5f,
    0x69,
    0x64,
    0x0a,
    0x80,
    0xc7,
    0xa7,
    0xad,
    0xa1,
    0xa3,
    0xcc,
    0xde,
    0x16,
    0x29,
    0xf9,
    0x7b,
    0xb8,
    0x5d,
    0x0d,
    0xdf,
    0x9d,
    0x13,
    0x4b,
    0x89,
    0xc4,
    0x7e,
    0xc6,
    0x05,
    0x9b,
    0x04,
    0xc2,
    0xc3,
    0x6f,
    0x63,
    0x7b,
    0x29,
    0xcf,
  ];

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
});
