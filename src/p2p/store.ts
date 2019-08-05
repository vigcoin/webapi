import { readFileSync, writeFileSync } from 'fs';
import * as moment from 'moment';
import { IPeerEntry } from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../cryptonote/serialize/writer';
import { uint32, uint64, UINT64 } from '../cryptonote/types';
import { logger } from '../logger';
import { IP } from '../util/ip';
import { PeerManager } from './peer-manager';
import { P2PServer } from './server';

export class P2PStore {
  public static getStore(
    file: string,
    server: P2PServer,
    peerManager: PeerManager,
    read: boolean
  ) {
    logger.info('Found P2PState File : ' + file);
    logger.info('Reading P2PState from File : ' + file);
    const p2pStore = new P2PStore(file);
    if (read) {
      p2pStore.read(server, peerManager);
      logger.info('Finished Reading P2PState from File : ' + file);
    }
    return p2pStore;
  }

  public static saveStore(
    file: string,
    server: P2PServer,
    peerManager: PeerManager
  ) {
    logger.info('Saveing P2PState file : ' + file);
    server.p2pStore.write(server, peerManager);
    logger.info('Finished writing P2PState to File : ' + file);
  }
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
    logger.info('Read P2PServer version : ' + server.version);

    peerManager.version = reader.readVarint();
    logger.info('Read peer manager version : ' + peerManager.version);
    logger.info('Read white peer list : ' + peerManager.version);
    peerManager.white = this.readPeerEntryList(reader);
    logger.info('Read gray peer list : ' + peerManager.version);
    peerManager.gray = this.readPeerEntryList(reader);
    server.id = reader.readVarintBuffer();
    logger.info('Read P2PServer peer id : ' + server.id.toString('hex'));
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
    logger.info('Read peer entry list size : ' + size);
    const list = [];
    for (let i = 0; i < size; i++) {
      const pe = this.readPeerEntry(reader);
      logger.info(
        'Read peer entry ' +
          IP.toString(pe.peer.ip) +
          ':' +
          pe.peer.port +
          ', last seen: ' +
          moment(pe.lastSeen).format('YYYY-MM-DD HH:mm:ss') +
          ', id: ' +
          pe.id.toString('hex')
      );
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
