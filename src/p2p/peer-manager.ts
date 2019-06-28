import { IPeerEntry } from '../cryptonote/p2p';
import { uint32 } from '../cryptonote/types';
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
  private dir: string;

  // peers
  private peers: IPeerEntry[] = [];
  private whitePeers: PeerList;
  private grayPeers: PeerList;

  constructor(dir: string, white: PeerList, gray: PeerList) {
    this.dir = dir;
    this.whitePeers = white;
    this.grayPeers = gray;
  }

  public get(i: number): IPeerEntry {
    return this.peers[i];
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
