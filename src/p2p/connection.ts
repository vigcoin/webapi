import { Hash } from '../crypto/types';

export enum ConnectionState {
  BEFORE_HANDSHAKE = 0,
  SYNCHRONIZING,
  IDLE,
  NORMAL,
  SYNC_REQURIED,
  POOL_SYNC_REQUIRED,
  SHUTDOWN,
}

export class ConnectionContext {
  protected version: number; // unit8
  protected id: string; // boost::uuids::uuid
  protected ip: number = 0; // uint32
  protected port: number = 0; // uint32
  protected isIncoming: boolean = false;
  protected startTime: Date;
  protected state: ConnectionState = ConnectionState.BEFORE_HANDSHAKE;
  protected neededObjects: Hash[];
  protected requestedObjects: Hash[];
  protected remoteBlockchainHeight: number = 0; // uint32;
  protected lastResponseHeight: number = 0; // unit32;

  public getState() {
    return this.state;
  }
}
