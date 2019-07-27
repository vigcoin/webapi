import { Hash } from '../../../crypto/types';
import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSResponseChain {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 7,
  }
  export interface IRequest {
    blockHashes: Hash[];
    startHeight: uint32;
    totalHeight: uint32;
  }
}
