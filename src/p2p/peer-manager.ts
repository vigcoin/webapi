import { IPeerEntry } from '../cryptonote/p2p';
import { uint32, uint8 } from '../cryptonote/types';
import { IP } from '../util/ip';

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
      return;
    }
    if (this.whitePeers.find(pe) !== -1) {
      return;
    }
    this.grayPeers.append(pe);
  }
}