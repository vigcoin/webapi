import { IPeerEntry, uint32, uint8 } from '@vigcoin/types';
import { IP } from '@vigcoin/util';
import * as moment from 'moment';
import { logger } from '../logger';

export class PeerList {
  private list: IPeerEntry[] = [];
  private maxSize: uint32 = 255;

  constructor(maxSize: uint32) {
    this.maxSize = maxSize;
  }
  get size(): number {
    return this.list.length;
  }
  get peers(): IPeerEntry[] {
    return this.list;
  }

  set peers(list: IPeerEntry[]) {
    this.list = list;
  }

  public find(pe: IPeerEntry) {
    return this.list.findIndex(item => {
      if (pe.peer.ip !== item.peer.ip) {
        return false;
      }
      if (pe.peer.port !== item.peer.port) {
        return false;
      }
      return true;
    });
  }

  public append(pe: IPeerEntry) {
    const found = this.find(pe);
    if (found !== -1) {
      this.list.splice(found, 1);
    }
    this.list.push(pe);
    this.list.sort((a: IPeerEntry, b: IPeerEntry) => {
      return b.lastSeen.getTime() - a.lastSeen.getTime();
    });
    this.trim();
  }

  public remove(pe: IPeerEntry) {
    this.list = this.list.filter(item => {
      if (pe.peer.ip !== item.peer.ip) {
        return true;
      }
      if (pe.peer.port !== item.peer.port) {
        return true;
      }
      return false;
    });
  }

  public trim() {
    while (this.list.length > this.maxSize) {
      this.list.shift();
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class PeerManager {
  // peers
  private whitePeers: PeerList;
  private grayPeers: PeerList;

  // tslint:disable-next-line:variable-name
  private _version: uint8 = 1;

  constructor(white: PeerList, gray: PeerList) {
    this.whitePeers = white;
    this.grayPeers = gray;
  }

  get version(): uint8 {
    return this._version;
  }

  set version(version: uint8) {
    this._version = version;
  }

  get white(): IPeerEntry[] {
    return this.whitePeers.peers;
  }

  set white(list: IPeerEntry[]) {
    this.whitePeers.peers = list;
  }

  get gray(): IPeerEntry[] {
    return this.grayPeers.peers;
  }

  set gray(list: IPeerEntry[]) {
    this.grayPeers.peers = list;
  }

  public appendWhite(pe: IPeerEntry) {
    if (!IP.isAllowed(pe.peer.ip)) {
      return;
    }
    this.whitePeers.append(pe);
    this.grayPeers.remove(pe);
  }

  public appendGray(pe: IPeerEntry) {
    if (!IP.isAllowed(pe.peer.ip)) {
      logger.warn('IP : ' + IP.toString(pe.peer.ip) + ' not allowed!');
      return;
    }
    if (this.grayPeers.find(pe) !== -1) {
      logger.warn('IP : ' + IP.toString(pe.peer.ip) + ' existed!');
      return;
    }
    logger.warn('IP : ' + IP.toString(pe.peer.ip) + ' successfully added!');
    this.grayPeers.append(pe);
  }

  public merge(pes: IPeerEntry[]) {
    for (const pe of pes) {
      this.appendGray(pe);
    }
  }

  public getLocalPeerList(): IPeerEntry[] {
    return this.gray.sort((a: IPeerEntry, b: IPeerEntry) => {
      return b.lastSeen.getTime() - a.lastSeen.getTime();
    });
  }

  public handleRemotePeerList(localTime: Date, peerEntries: IPeerEntry[]) {
    logger.info('Handle remote peer list!');
    for (const pe of peerEntries) {
      logger.info(
        'Peer found: ' + IP.toString(pe.peer.ip) + ':' + pe.peer.port
      );
      logger.info(
        'Last seen: ' + moment(pe.lastSeen).format('YYYY-MM-DD HH:mm:ss')
      );
    }
    const now = Date.now();
    const delta = now - localTime.getTime();
    logger.info('Delta time is ' + delta);
    for (const pe of peerEntries) {
      if (pe.lastSeen.getTime() > localTime.getTime()) {
        logger.error('Found FUTURE peer entry!');
        logger.error(
          'Last seen: ' + moment(pe.lastSeen).format('YYYY-MM-DD HH:mm:ss')
        );
        logger.error(
          'Remote local time: ' +
            moment(localTime).format('YYYY-MM-DD HH:mm:ss')
        );
        return false;
      }
      pe.lastSeen = new Date(pe.lastSeen.getTime() + delta);
    }
    logger.info('Entries Merged!');
    this.merge(peerEntries);
  }
}
