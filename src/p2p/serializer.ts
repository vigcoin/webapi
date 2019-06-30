import { readFileSync, writeFileSync } from 'fs';
import { IPeerEntry } from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../cryptonote/serialize/writer';
import { uint32, uint64, UINT64 } from '../cryptonote/types';
import { PeerManager } from './peer-manager';
import { P2PServer } from './server';

export class P2PStore {
  private file: string;
  constructor(file: string) {
    this.file = file;
  }

  public write(server: P2PServer, peerManager: PeerManager) {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    writer.writeVarint(server.version);
    writer.writeVarint(peerManager.version);
    this.writePeerEntryList(writer, peerManager.white);
    this.writePeerEntryList(writer, peerManager.gray);
    writer.writeVarintBuffer(server.id);
    writeFileSync(this.file, writer.getBuffer());
  }

  public read(server: P2PServer, peerManager: PeerManager) {
    const buffer: Buffer = readFileSync(this.file);
    const reader = new BufferStreamReader(buffer);
    server.version = reader.readVarint();
    peerManager.version = reader.readVarint();
    peerManager.white = this.readPeerEntryList(reader);
    peerManager.gray = this.readPeerEntryList(reader);
    server.id = reader.readVarintBuffer();
  }

  private writePeerEntryList(writer: BufferStreamWriter, list: IPeerEntry[]) {
    writer.writeVarint(list.length);
    for (const item of list) {
      this.writePeerEntry(writer, item);
    }
  }

  private writePeerEntry(writer: BufferStreamWriter, pe: IPeerEntry) {
    writer.writeVarint(pe.peer.ip);
    writer.writeVarint(pe.peer.port);
    // tslint:disable-next-line:no-bitwise
    writer.writeVarintBuffer(pe.id);
    writer.writeVarint(Math.floor(pe.lastSeen.getTime() / 1000));
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
    const id: UINT64 = reader.readVarintUInt64();
    const lastSeen: uint64 = reader.readVarint();
    return {
      id,
      peer: {
        ip,
        port,
      },
      // tslint:disable-next-line:object-literal-sort-keys
      lastSeen: new Date(lastSeen * 1000),
    };
  }
}
