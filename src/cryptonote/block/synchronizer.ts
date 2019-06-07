import { EventEmitter } from 'events';
import { Hash } from '../../crypto/types';

export enum SyncState {
  IDLE = 0,
  POOL = 1,
  BLOCK = 2,
  STOPPED = 3,
}
export class Synchronizer extends EventEmitter {
  private genesis: Hash;
  private state: SyncState;
  constructor(genesis: Hash) {
    super();
    this.genesis = genesis;
    this.state = SyncState.STOPPED;
  }
}
