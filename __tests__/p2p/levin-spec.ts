import * as assert from 'assert';
import { createConnection, createServer } from 'net';
import { BlockChain } from '../../src/cryptonote/block/blockchain';
import { BufferStreamReader } from '../../src/cryptonote/serialize/reader';
import { getBlockChain } from '../../src/init/blockchain';
import { ILevinCommand, LevinProtocol, LevinState } from '../../src/p2p/levin';
import { handshake, ping, timedsync } from '../../src/p2p/protocol';
import {
  handshakeRequest,
  kvHeader,
  pingRequest,
  timesyncRequest,
} from './data';

import { data as mainnet } from '../../src/init/net-types/mainnet';

import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import * as path from 'path';
import { cryptonote } from '../../src/config';
import { PROCESSED } from '../../src/config/events';
import { Configuration } from '../../src/config/types';
import { IPeerNodeData } from '../../src/cryptonote/p2p';
import { NSNewBlock } from '../../src/cryptonote/protocol/commands/new-block';
import { NSRequestTXPool } from '../../src/cryptonote/protocol/commands/request-tx-pool';
import { BufferStreamWriter } from '../../src/cryptonote/serialize/writer';
import { getMemoryPool } from '../../src/init/mem-pool';
import { getDefaultPeerManager, getP2PServer } from '../../src/init/p2p';
import { P2PConfig } from '../../src/p2p/config';
import { ConnectionContext, ConnectionState } from '../../src/p2p/connection';
import { ConnectionManager } from '../../src/p2p/connection-manager';
import { Handler } from '../../src/p2p/protocol/handler';
import { getBlockFile } from '../../src/util/fs';
import { IP } from '../../src/util/ip';
import { Command } from '../../src/p2p/protocol/command';
import { NSResponseGetObjects } from '../../src/cryptonote/protocol/commands/response-get-objects';

const dir = path.resolve(__dirname, '../vigcoin');
const config: Configuration.ICurrency = {
  block: {
    genesisCoinbaseTxHex: '111',
    version: {
      major: 1,
      minor: 1,
      patch: 1,
    },
  },
  blockFiles: getBlockFile(dir, mainnet),
  hardfork: [],
};
const bc: BlockChain = getBlockChain(config);
bc.init();

const memPool = getMemoryPool(dir, mainnet);

const handler = new Handler(bc, memPool);

const p2pserver = getP2PServer(dir, mainnet);
const peerId = randomBytes(8);
const networkId = cryptonote.NETWORK_ID;
const p2pConfig = new P2PConfig();
const connectionManager = new ConnectionManager(
  peerId,
  networkId,
  p2pConfig,
  handler
);
const pm = getDefaultPeerManager();

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

  it('should write header', () => {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    LevinProtocol.writeHeader(writer, 1, Buffer.from([1, 2, 3, 4]), 1, true);
    LevinProtocol.writeHeader(writer, 1, Buffer.from([1, 2, 3, 4]), 1);

    LevinProtocol.writeHeader(writer, 1, Buffer.from([1, 2, 3, 4]));
  });

  it('should response', () => {
    LevinProtocol.response(1, Buffer.from([1, 2, 3, 4]), 1, true);
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
      const { levin } = connectionManager.initContext(pm, socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      // 'connect' listener
      client.write(Buffer.from(pingRequest));
      const { levin } = connectionManager.initContext(pm, client);
      levin.on('ping', (res: ping.IResponse) => {
        assert(String(res.status) === 'OK');
        assert(processed);
        client.destroy();
        server.close();
        done();
      });
    });
  });

  it('should handle levin ping no response request', done => {
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const request: ping.IRequest = {};
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      ping.Writer.request(writer, request);
      const buffer = LevinProtocol.request(
        ping.ID.ID,
        writer.getBuffer(),
        0,
        false
      );
      // 'connect' listener
      client.write(buffer);
    });
  });

  it('should handle levin timedsync protocol', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.on('processed', message => {
        assert(message === 'timedsync');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      client.write(Buffer.from(timesyncRequest));
      const { levin } = connectionManager.initContext(pm, client);
      levin.on('timedsync', (res: timedsync.IResponse) => {
        assert(!!res.localTime);
        assert(processed);
        client.destroy();
        server.close();
        done();
      });
    });
  });

  // it('should handle levin timesync no response request', done => {
  //   const server = createServer(socket => {
  //     const { levin } = p2pserver.initContext(socket);
  //     levin.on('processed', message => {
  //       assert(message === 'timedsync');
  //       client.destroy();
  //       server.close();
  //       done();
  //     });
  //   });
  //   const port = Math.floor(Math.random() * 1000) + 10240;
  //   server.listen(port);
  //   const client = createConnection({ port }, () => {
  //     const request: timedsync.IRequest = {
  //       payload: {
  //         currentHeight: 1,
  //         hash: getRandomBytes(32),
  //       },
  //     };
  //     const writer = new BufferStreamWriter(Buffer.alloc(0));
  //     ping.Writer.request(writer, request);
  //     const buffer = LevinProtocol.request(
  //       timedsync.ID.ID,
  //       writer.getBuffer(),
  //       0,
  //       false
  //     );
  //     // 'connect' listener
  //     client.write(buffer);
  //   });
  // });

  it('should try ping', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);

      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const { levin, context } = connectionManager.initContext(pm, client);

      const data: IPeerNodeData = {
        networkId: cryptonote.NETWORK_ID,
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(1561880936 * 1000),
        myPort: 19800,
        peerId: Buffer.from([0x12, 0x75, 0x23, 0x65, 0x0f, 0x9b, 0x42, 0x3b]),
      };
      context.ip = IP.toNumber('183.14.133.114');
      const { success, response } = await levin.tryPing(data, context);
      assert(success);
      const message = response as ping.IResponse;
      assert(String(message.status) === ping.PING_OK_RESPONSE_STATUS_TEXT);
      processed = true;
      assert(processed);
      client.destroy();
      server.close();
      done();
    });
  });

  it('should try ping with zero port', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const { levin, context } = connectionManager.initContext(pm, client);
      const data: IPeerNodeData = {
        networkId: cryptonote.NETWORK_ID,
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(1561880936 * 1000),
        myPort: 0,
        peerId: Buffer.from([0x12, 0x75, 0x23, 0x65, 0x0f, 0x9b, 0x42, 0x3b]),
      };
      context.ip = IP.toNumber('183.14.133.114');
      const { success } = await levin.tryPing(data, context);
      assert(!success);
      client.destroy();
      server.close();
      done();
    });
  });

  it('should try ping with disallowed ip', done => {
    let processed = false;
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.on('processed', message => {
        assert(message === 'ping');
        processed = true;
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const { levin, context } = connectionManager.initContext(
        pm,
        client,
        false
      );
      const data: IPeerNodeData = {
        networkId: cryptonote.NETWORK_ID,
        version: 1,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(1561880936 * 1000),
        myPort: 19800,
        peerId: Buffer.from([0x12, 0x75, 0x23, 0x65, 0x0f, 0x9b, 0x42, 0x3b]),
      };
      const { success } = await levin.tryPing(data, context);
      assert(!success);
      client.destroy();
      server.close();
      done();
    });
  });

  it('should handle levin handshake protocol', done => {
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);

      levin.on('processed', message => {
        assert(message === 'handshake');
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      client.write(Buffer.from(handshakeRequest));
      connectionManager.initContext(pm, client, false);
    });
  });

  it('should handle unkown cmd', done => {
    let caught = false;
    const server = createServer(socket => {
      const { levin, context } = connectionManager.initContext(pm, socket);
      const cmd: ILevinCommand = {
        buffer: Buffer.alloc(0),
        command: 1,
        isNotify: false,
        isResponse: false,
      };

      try {
        levin.onCommand(cmd, context, handler);
      } catch (e) {
        caught = true;
      }
      assert(!caught);
      client.destroy();
      server.close();
      done();
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      // client.write(Buffer.from([]));
    });
  });

  it('should handle on incoming error data', done => {
    function changeState(context: ConnectionContext, state) {
      context.state = state;
    }
    const server = createServer(socket => {
      const { levin, context } = connectionManager.initContext(pm, socket);
      const bsr = new BufferStreamReader(Buffer.from([1, 2, 3, 4, 5]));
      changeState(context, ConnectionState.SYNC_REQURIED);
      levin.onIncomingData(bsr, context, handler);
      assert(context.state === ConnectionState.SHUTDOWN);

      changeState(context, ConnectionState.POOL_SYNC_REQUIRED);
      levin.onIncomingData(bsr, context, handler);
      assert(context.state === ConnectionState.SHUTDOWN);
      server.close();
      client.destroy();
      done();
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      // client.write(Buffer.from([1, 2, 3, 4]));
    });
  });

  it('should handle wrong invoke data', done => {
    const server = createServer(socket => {
      socket.on('data', () => {
        socket.write(randomBytes(138));
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const { levin } = connectionManager.initContext(pm, client);
      const request: ping.IRequest = {};
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      ping.Writer.request(writer, request);
      let caught = false;
      try {
        await levin.invoke(timedsync, writer.getBuffer());
      } catch (e) {
        caught = true;
      }
      assert(caught);
      client.destroy();
      server.close();
      done();
    });
  });

  it('should handle wrong invoke data 2', done => {
    const server = createServer(socket => {
      socket.on('data', () => {
        const response: timedsync.IResponse = {
          localTime: new Date(),
          payload: {
            currentHeight: Math.floor(Math.random() * 10000),
            hash: randomBytes(32),
          },
          // tslint:disable-next-line:object-literal-sort-keys
          localPeerList: [],
        };
        const writer = new BufferStreamWriter(Buffer.alloc(0));
        timedsync.Writer.response(writer, response);
        const data = LevinProtocol.request(
          timedsync.ID.ID,
          writer.getBuffer(),
          1,
          false
        );
        socket.write(data);
      });
    });

    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, async () => {
      const { levin } = connectionManager.initContext(pm, client);
      const request: ping.IRequest = {};
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      ping.Writer.request(writer, request);
      let caught = false;
      try {
        await levin.invoke(timedsync, writer.getBuffer());
      } catch (e) {
        caught = true;
      }
      assert(caught);
      client.destroy();
      server.close();
      done();
    });
  });

  // Levin cryptonote protocol

  it('should handle tx memory pool', done => {
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_REQUEST_TX_POOL);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(
        NSRequestTXPool,
        Buffer.from([
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
        ])
      );
    });
  });

  it('should handle new block', done => {
    const server = createServer(socket => {
      const { levin } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_NEW_BLOCK);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const buffer = readFileSync(
        path.resolve(__dirname, './data/new-block.dat')
      );
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(NSNewBlock, buffer);
    });
  });

  it('should handle new block', done => {
    const server = createServer(socket => {
      const { levin, context } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      context.state = ConnectionState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_NEW_BLOCK);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const buffer = readFileSync(
        path.resolve(__dirname, './data/new-block.dat')
      );
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(NSNewBlock, buffer);
    });
  });

  it('should handle response get objects', done => {
    const server = createServer(socket => {
      const { levin, context } = connectionManager.initContext(pm, socket);
      levin.state = LevinState.NORMAL;
      context.state = ConnectionState.NORMAL;
      levin.on(PROCESSED, message => {
        assert(message === Command.NOTIFY_RESPONSE_GET_OBJECTS);
        client.destroy();
        server.close();
        done();
      });
    });
    const port = Math.floor(Math.random() * 1000) + 10240;
    server.listen(port);
    const client = createConnection({ port }, () => {
      const buffer = readFileSync(
        path.resolve(__dirname, './data/response-get-objects.bin')
      );
      const { levin } = connectionManager.initContext(pm, client);
      levin.invoke(NSResponseGetObjects, buffer);
    });
  });

  it('should close p2p server', async () => {
    await p2pserver.stop();
  });
});
