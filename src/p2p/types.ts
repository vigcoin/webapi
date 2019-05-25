import { Hash } from "../crypto/types";

export interface IPeer {
  port: number;
  host: string;
}

export interface IPeerEntry {
  id: number;
  host: IPeer;
  lastSeen: Date;
}

export interface IConnectionEntry {
  host: IPeer;
  id: number;
  isIncome: boolean;
}

// Protocols

export enum Version {
  V0 = 0,
  V1 = 1,
  CURRENT = V1
}

export interface INetwork {
  connectionsCount: number;
  conectionTimeout: number;
  pingConnectionTimeout: number;
  handshakeInterval: number;
  packageMaxSize:number;
  id:number;
  sendPeerListSize: number;
}

export interface INodeData {
  networkId: string,
  version: Version,
  localTime: Date,
  myPort: number,
  peerId: number
}


export interface ICoreSyncData {
  currentHeight: number,
  hash: Hash
}

export interface IConfig {
  port: number,
  host: string,
  externalPort?: number,
  isAllowLocalIp?: boolean,
  peers?: IPeerEntry[],
  priorityNode?: IPeer[],
  exclusiveNode?: IPeer[],
  seedNode?: IPeer[],
  hideMyPort?: number
};