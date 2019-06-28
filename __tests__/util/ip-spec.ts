import * as assert from 'assert';
import { IP } from '../../src/util/ip';

describe('test ip', () => {
  test('Should to number/string', async () => {
    assert(IP.toString(IP.toNumber('127.0.0.1')) === '127.0.0.1');
    assert(IP.toString(IP.toNumber('22.1.100.1')) === '22.1.100.1');
  });

  test('Should test loopback', async () => {
    const ip = IP.toNumber('127.0.0.1');
    assert(IP.isLoopback(ip) === true);
    assert(IP.isLoopback(IP.toNumber('192.168.0.1')) === false);
  });

  test('Should test private', async () => {
    assert(IP.isPrivate(IP.toNumber('127.0.0.1')) === false);
    assert(IP.isPrivate(IP.toNumber('192.168.0.1')) === true);
    assert(IP.isPrivate(IP.toNumber('10.168.0.1')) === true);
    assert(IP.isPrivate(IP.toNumber('172.16.0.1')) === true);
    assert(IP.isPrivate(IP.toNumber('8.8.8.8')) === false);
  });

  test('Should test is allowed', async () => {
    assert(IP.isAllowed(IP.toNumber('127.0.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('192.168.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('10.168.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('172.16.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('8.8.8.8')) === true);
    IP.enableLocalIP(true);
    assert(IP.isAllowed(IP.toNumber('127.0.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('192.168.0.1')) === true);
    assert(IP.isAllowed(IP.toNumber('10.168.0.1')) === true);
    assert(IP.isAllowed(IP.toNumber('172.16.0.1')) === true);
    assert(IP.isAllowed(IP.toNumber('8.8.8.8')) === true);
    IP.enableLocalIP();
    assert(IP.isAllowed(IP.toNumber('127.0.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('192.168.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('10.168.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('172.16.0.1')) === false);
    assert(IP.isAllowed(IP.toNumber('8.8.8.8')) === true);
  });

  test('Should throw with wrong ip', async () => {
    let catched = false;
    try {
      const ip = IP.toNumber('a.0.b.1');
    } catch (e) {
      catched = true;
    }
    assert(catched);
  });
});
