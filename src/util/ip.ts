import { uint32 } from '../cryptonote/types';
export class IP {
  public static isLoopback(ip: uint32) {
    // 127.0.0.0/8
    // tslint:disable-next-line:no-bitwise
    return (ip & 0xff000000) === 0x7f000000;
  }
  public static isPrivate(ip: uint32) {
    // 10.0.0.0/8
    // tslint:disable-next-line:no-bitwise
    if ((ip & 0xff000000) >>> 0 === 0x0a000000) {
      return true;
    }

    // 172.16.0.0/12
    // tslint:disable-next-line:no-bitwise
    if ((ip & 0xfff00000) >>> 0 === 0xac100000) {
      return true;
    }

    // 192.168.0.0/16
    // tslint:disable-next-line:no-bitwise
    if ((ip & 0xffff0000) >>> 0 === 0xc0a80000) {
      return true;
    }
    return false;
  }

  public static toNumber(ip: string): number {
    if (ip.substr(0, 7) === '::ffff:') {
      ip = ip.substr(7);
    }
    const re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const matches = ip.match(re);
    if (!matches) {
      throw new Error('Invalid IP Address');
    }
    const buffer = new Buffer(4);
    buffer.writeUInt8(parseInt(matches[1], 10), 0);
    buffer.writeUInt8(parseInt(matches[2], 10), 1);
    buffer.writeUInt8(parseInt(matches[3], 10), 2);
    buffer.writeUInt8(parseInt(matches[4], 10), 3);
    return buffer.readUInt32BE(0);
  }

  public static toString(ip: uint32): string {
    const buffer = new Buffer(4);
    buffer.writeUInt32BE(ip, 0);
    const slices = [];
    for (let i = 0; i < buffer.length; i++) {
      const v = buffer.readUInt8(i);
      slices.push(v + '');
    }
    return slices.join('.');
  }

  public static isAllowed(ip: uint32): boolean {
    if (IP.isLoopback(ip)) {
      return false;
    }

    if (!IP.allowLocalIP && IP.isPrivate(ip)) {
      return false;
    }
    return true;
  }

  public static enableLocalIP(enable: boolean = false) {
    IP.allowLocalIP = enable;
  }

  private static allowLocalIP: boolean = false;
}
