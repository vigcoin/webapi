import * as assert from 'assert';
import { exec } from 'child_process';
import * as path from 'path';
import { P2PConfig } from '../../src/p2p/config';

function cli(filename, args) {
  return new Promise(resolve => {
    const p2p = exec(
      `ts-node ${filename} ${args.join(' ')}`,
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          // tslint:disable-next-line:object-literal-sort-keys
          stderr,
        });
      }
    );
    setTimeout(() => {
      p2p.kill();
    }, 500);
  });
}

describe('test p2p config', () => {
  it('should test config', () => {
    const p2pConfig = new P2PConfig();
    assert(p2pConfig.allowLocalIp === false);
    assert(p2pConfig.dataDir === '');
    assert(p2pConfig.exclusiveNodes.length === 0);
    assert(p2pConfig.filename === '');
    assert(p2pConfig.hideMyPort === false);
    assert(p2pConfig.p2pBindIp === '0.0.0.0');
    assert(p2pConfig.p2pBindPort === 0);
    assert(p2pConfig.p2pExternalPort === 0);
    assert(p2pConfig.peers.length === 0);
    assert(p2pConfig.priorityNodes.length === 0);
    assert(p2pConfig.exclusiveNodes.length === 0);
    assert(p2pConfig.seedNodes.length === 0);

    p2pConfig.init({
      addExclusiveNode: '192.168.0.1:8080,192.168.0.1:8081',
      addPeer: '192.168.0.1:8080,192.168.0.1:8081',
      allowLocalIp: true,
      p2pBindPort: 8080,
    });
    assert(p2pConfig.p2pBindPort === 8080);
    assert(p2pConfig.allowLocalIp === true);
    assert(p2pConfig.exclusiveNodes.length === 2);
    assert(p2pConfig.peers.length === 2);
    assert(p2pConfig.seedNodes.length === 0);

    p2pConfig.init({
      dataDir: '/data',
    });
    assert(p2pConfig.dataDir === '/data');
  });

  it('should test hideMyPort', () => {
    const p2pConfig = new P2PConfig();
    p2pConfig.init({
      hideMyPort: true,
    });
    const myPort = p2pConfig.getMyPort();
    assert(myPort === 0);
  });

  it('should test p2pExternalPort', () => {
    const p2pConfig = new P2PConfig();
    p2pConfig.init({
      p2pExternalPort: 8088,
    });
    const myPort = p2pConfig.getMyPort();
    assert(myPort === 8088);
  });

  it('should test p2pBindPort', () => {
    const p2pConfig = new P2PConfig();
    p2pConfig.init({
      p2pBindPort: 8081,
    });
    const myPort = p2pConfig.getMyPort();
    assert(myPort === 8081);
  });

  // it('should test cli', async () => {
  //   const res: any = await cli(
  //     path.resolve(__dirname, '../../src/cli/p2p.ts'),
  //     [
  //       '--testnet',
  //       '--allow-local-ip',
  //       '--hide-my-port',
  //       '--p2p-bind-ip',
  //       '3.1.13.3',
  //       '--p2p-bind-port',
  //       '10086',
  //       '--p2p-external-port',
  //       '80',
  //       '--add-peer',
  //       '192.168.0.1:8080,192.168.0.1:8081',
  //       '--add-priority-node',
  //       '192.168.0.1:1888',
  //       '--add-exclusive-node',
  //       '192.183.12.1:8080',
  //       '--seed-node',
  //       '192.168.1.2:8080,192.181.11.11:80,192.168.3.1:891',
  //       '--data-dir',
  //       './aaa',
  //     ]
  //   );
  //   assert(res.code === 0);
  // });
});
