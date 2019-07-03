import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BlockChain } from '../../src/cryptonote/block/blockchain';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { getBlockChain, getBlockFile } from '../../src/init/blockchain';
import { P2pConnectionContext } from '../../src/p2p/connection';
import { LevinProtocol } from '../../src/p2p/levin';
import { handshake, ping, timedsync } from '../../src/p2p/protocol';
import { kvHeader, pingRequest, timesyncRequest } from './data';

import * as path from 'path';
import { getP2PServer } from '../../src/init/p2p';
import { Handler } from '../../src/p2p/protocol/handler';
import { cryptonote } from '../../src/config';
import { IPeerNodeData } from '../../src/cryptonote/p2p';
import { IP } from '../../src/util/ip';

const dir = path.resolve(__dirname, '../vigcoin');
const bc: BlockChain = getBlockChain(getBlockFile(dir));
bc.init();

const handler = new Handler(bc);

const p2pserver = getP2PServer(dir);

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
      const { levin } = p2pserver.initContext(socket);
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
      const { levin } = p2pserver.initContext(client);
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
      const { levin } = p2pserver.initContext(socket);
      levin.on('processed', message => {
        assert(message === 'timedsync');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      client.write(Buffer.from(timesyncRequest));
      const { levin } = p2pserver.initContext(client);
      levin.on('timedsync', (res: timedsync.IResponse) => {
        assert(!!res.localTime);
        assert(processed);
        client.destroy();
        server.close();
        done();
      });
    });
  });

  it('should try ping', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = p2pserver.initContext(socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const { levin, context } = p2pserver.initContext(client);
      const data: IPeerNodeData = {
        networkId: cryptonote.NETWORK_ID,
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(1561880936 * 1000),
        myPort: 19800,
        peerId: Buffer.from([0x12, 0x75, 0x23, 0x65, 0x0f, 0x9b, 0x42, 0x3b]),
      };
      context.ip = IP.toNumber('183.14.133.114');
      levin.tryPing(data, context);
      levin.on('ping', message => {
        processed = true;
        assert(processed);
        client.destroy();
        server.close();
        done();
      });
    });
  });

  it('should try ping with zero port', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = p2pserver.initContext(socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const { levin, context } = p2pserver.initContext(client);
      const data: IPeerNodeData = {
        networkId: cryptonote.NETWORK_ID,
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(1561880936 * 1000),
        myPort: 0,
        peerId: Buffer.from([0x12, 0x75, 0x23, 0x65, 0x0f, 0x9b, 0x42, 0x3b]),
      };
      context.ip = IP.toNumber('183.14.133.114');
      assert(!levin.tryPing(data, context));
      client.destroy();
      server.close();
      done();
    });
  });

  it('should try ping with disallowed ip', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = p2pserver.initContext(socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 1024;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const { levin, context } = p2pserver.initContext(client);
      const data: IPeerNodeData = {
        networkId: cryptonote.NETWORK_ID,
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(1561880936 * 1000),
        myPort: 19800,
        peerId: Buffer.from([0x12, 0x75, 0x23, 0x65, 0x0f, 0x9b, 0x42, 0x3b]),
      };
      assert(!levin.tryPing(data, context));
      client.destroy();
      server.close();
      done();
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
