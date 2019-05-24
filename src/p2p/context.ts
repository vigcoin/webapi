import { Hash } from "../crypto/types";

export enum State {
  BEFORE_HANDSHAKE = 0,
  SYNCHRONIZING,
  IDEL,
  NORMAL,
  SYNC_REQUIRED,
  POOL_SYNC_REQUIRED,
};


export interface IConnection {
  version: number;
  id: string;
  remoteHost: string;
  port: number;
  isIncoming: boolean;
  startTime: Date;
  state: State;
  neededObjects: Hash;
  requestedObjects: Hash;
  remoteBlockchainHeight: number;
  lastResponseHeight: number;
}