import { Hash } from '../crypto/types';

export interface IPeer {
  port: number;
  host: string;
}

export interface IPeerEntry {
  id: number; // uint64
  host: IPeer;
  lastSeen: Date; // uint64
}

export interface IConnectionEntry {
  id: number; // uint64
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
  connectionsCount: number;
  conectionTimeout: number;
  pingConnectionTimeout: number;
  handshakeInterval: number;
  packageMaxSize: number;
  id: number;
  sendPeerListSize: number;
}

export interface INetworkPeer {
  network: INetwork;
  id: number;
}

export interface INodeData {
  networkId: number[];
  version: Version;
  localTime: Date;
  myPort: number;
  peerId: number;
}

export interface ICoreSyncData {
  currentHeight: number;
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

export type IPeerIDType = number; // uint64
export type uuid = string; // boost::uuids::uuid

export enum EMessageType {
  COMMAND,
  REPLY,
  NOTIFY,
}

export interface IMessage {
  type: EMessageType;
  command: number; // uint32
  buffer: Buffer;
  code: number; // int32
}

export interface ICommand<ID, REQ, RES> {
  id: ID;
  request: REQ;
  response: RES;
}

export interface IPeerNodeData {
  networkId: uuid;
  version: number; // uint8
  localTime: Date; // uint64
  myPort: number; // uint32
  peerId: number; // uint64
}
