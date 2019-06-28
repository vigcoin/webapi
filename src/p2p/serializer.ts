import { readFileSync } from 'fs';
import { IPeerEntry } from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { uint32, uint64 } from '../cryptonote/types';

export class P2PStore {
  private file: string;
  constructor(file: string) {
    this.file = file;
  }

  public read() {
    const buffer: Buffer = readFileSync(this.file);
    const reader = new BufferStreamReader(buffer);
    const version1 = reader.readVarint();
    const version2 = reader.readVarint();
    const white = this.readPeerEntryList(reader);
    const gray = this.readPeerEntryList(reader);
    const peerId = reader.readVarint();
    return {
      version: version1,
      // tslint:disable-next-line:object-literal-sort-keys
      peerManager: {
        version: version2,
        white,
        // tslint:disable-next-line:object-literal-sort-keys
        gray,
      },
      peerId,
    };
  }

  private readPeerEntryList(reader: BufferStreamReader): IPeerEntry[] {
    const size = reader.readVarint();
    const list = [];
    for (let i = 0; i < size; i++) {
      const pe = this.readPeerEntry(reader);
      list.push(pe);
    }
    return list;
  }

  private readPeerEntry(reader: BufferStreamReader): IPeerEntry {
    const ip: uint32 = reader.readVarint();
    const port: uint32 = reader.readVarint();
    const id: uint64 = reader.readVarint();
    const buffer = Buffer.alloc(8);
    buffer.writeDoubleLE(id, 0);
    const lastSeen: uint64 = reader.readVarint();
    return {
      id: buffer,
      peer: {
        ip,
        port,
      },
      // tslint:disable-next-line:object-literal-sort-keys
      lastSeen: new Date(lastSeen),
    };
  }
}
