import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { LevinProtocol } from '../../src/p2p/levin';

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
});
