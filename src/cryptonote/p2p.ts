import * as assert from 'assert';
import { Hash } from '../crypto/types';
import { int32, uint32, uint64, UINT64, uint8 } from './types';

export type IPeerIDType = UINT64; // uint64
export type uuid = uint8[]; // boost::uuids::uuid uint8[16]

export interface IPeer {
  port: uint32;
  ip: uint32;
}

export interface IPeerEntry {
  peer: IPeer;
  id: IPeerIDType;
  lastSeen: Date; // uint64
}

export interface IConnectionEntry {
  id: IPeerIDType; // uint64
  host: IPeer;
  isIncome: boolean;
}

// Protocols

export enum Version {
  V0 = 0,
  V1 = 1,
  CURRENT = V1,
}

export interface INetwork {
  connectionsCount: uint32;
  conectionTimeout: uint32;
  pingConnectionTimeout: uint32;
  handshakeInterval: uint32;
  packageMaxSize: uint32;
  id: uint32;
  sendPeerListSize: uint32;
}

export interface INetworkPeer {
  network: INetwork;
  id: number;
}

export interface INodeData {
  networkId: uuid;
  version: uint8;
  localTime: Date;
  myPort: uint32;
  peerId: IPeerIDType;
}

export interface ICoreSyncData {
  currentHeight: uint32;
  hash: Hash;
}

export interface IServerConfig {
  port: number;
  host: string;
  externalPort?: number;
  isAllowLocalIp?: boolean;
  peers?: IPeerEntry[];
  priorityNode?: IPeer[];
  exclusiveNode?: IPeer[];
  seedNode?: IPeer[];
  hideMyPort?: number;
}

export enum EMessageType {
  COMMAND,
  REPLY,
  NOTIFY,
}

export interface IMessage {
  type: EMessageType;
  command: uint32;
  buffer: Buffer;
  code: int32;
}

export interface ICommand<ID, REQ, RES> {
  id: ID;
  request: REQ;
  response: RES;
}

export interface IPeerNodeData {
  networkId: uuid;
  version: uint8; // uint8
  localTime: Date; // uint64
  myPort: uint32; // uint32
  peerId: IPeerIDType; // uint64
}

export function IP2Number(ip: string): number {
  if (ip.substr(0, 7) === '::ffff:') {
    ip = ip.substr(7);
  }
  if (
    !/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
      ip
    )
  ) {
    throw new Error('Invalid IP Address');
  }
  const buffer = new Buffer(4);
  buffer.writeUInt8(parseInt(RegExp.$1, 10), 0);
  buffer.writeUInt8(parseInt(RegExp.$2, 10), 1);
  buffer.writeUInt8(parseInt(RegExp.$3, 10), 2);
  buffer.writeUInt8(parseInt(RegExp.$4, 10), 3);
  return buffer.readUInt32LE(0);
}

export function IP2String(ip: uint32): string {
  const buffer = new Buffer(4);
  buffer.writeUInt32LE(ip, 0);
  const slices = [];
  for (let i = 0; i < buffer.length; i++) {
    const v = buffer.readUInt8(i);
    slices.push(v + '');
  }
  return slices.join('.');
}
