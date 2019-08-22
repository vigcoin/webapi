import { EventEmitter } from 'events';
import { IHash } from '../../crypto/types';

export enum SyncState {
  IDLE = 0,
  POOL = 1,
  BLOCK = 2,
  STOPPED = 3,
}
export class Synchronizer extends EventEmitter {
  private genesis: IHash;
  private state: SyncState;
  constructor(genesis: IHash) {
    super();
    this.genesis = genesis;
    this.state = SyncState.STOPPED;
  }
}
