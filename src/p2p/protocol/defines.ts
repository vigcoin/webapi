import * as assert from 'assert';
import {
  ICoreSyncData,
  IPeer,
  IPeerEntry,
  IPeerNodeData,
} from '../../cryptonote/p2p';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';

export const P2P_COMMAND_ID_BASE = 1000;

export enum EID {
  HANDSHAKE = P2P_COMMAND_ID_BASE + 1,
  TIMED_SYNC = P2P_COMMAND_ID_BASE + 2,
  PING = P2P_COMMAND_ID_BASE + 3,
  REQUEST_STATE_INFO = P2P_COMMAND_ID_BASE + 4,
  REQUEST_NETWORK_STATE = P2P_COMMAND_ID_BASE + 5,
  REQUEST_PEER_ID = P2P_COMMAND_ID_BASE + 6,
}

export function readIPeerNodeData(reader: BufferStreamReader): IPeerNodeData {
  const networkIdValue = reader.read(16);
  const version = reader.readUInt8();
  const localTime = reader.readDate();
  const myPort = reader.readUInt32();
  const peerId = reader.readDouble();
  const networkId = [];
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < networkIdValue.length; i++) {
    networkId.push(networkIdValue[i]);
  }
  return {
    networkId,
    version,
    // tslint:disable-next-line:object-literal-sort-keys
    localTime,
    myPort,
    peerId,
  };
}

export function writeIPeerNodeData(
  writer: BufferStreamWriter,
  data: IPeerNodeData
) {
  writer.write(new Buffer(data.networkId));
  writer.writeUInt8(data.version);
  writer.writeDate(data.localTime);
  writer.writeUInt32(data.myPort);
  writer.writeDouble(data.peerId);
}

export function readICoreSyncData(reader: BufferStreamReader): ICoreSyncData {
  const currentHeight = reader.readUInt32();
  const hash = reader.readHash();
  return {
    currentHeight,
    hash,
  };
}

export function writeICoreSyncData(
  writer: BufferStreamWriter,
  data: ICoreSyncData
) {
  writer.writeUInt32(data.currentHeight);
  writer.writeHash(data.hash);
}

export function readIPeer(reader: BufferStreamReader): IPeer {
  const ip = reader.readUInt32();
  const port = reader.readUInt32();
  return {
    ip,
    port,
  };
}

export function writeIPeer(writer: BufferStreamWriter, peer: IPeer) {
  writer.writeUInt32(peer.ip);
  writer.writeUInt32(peer.port);
}

export function readIPeerEntry(reader: BufferStreamReader): IPeerEntry {
  const peer = readIPeer(reader);
  const id = reader.readDouble();
  const lastSeen = reader.readDate();
  return {
    peer,
    // tslint:disable-next-line:object-literal-sort-keys
    id,
    lastSeen,
  };
}

export function writeIPeerEntry(
  writer: BufferStreamWriter,
  peerEntry: IPeerEntry
) {
  writeIPeer(writer, peerEntry.peer);
  writer.writeDouble(peerEntry.id);
  writer.writeDate(peerEntry.lastSeen);
}
