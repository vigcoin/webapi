import { Hash } from '../../../crypto/types';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
namespace NSRequestChain {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 6,
  }
  export interface IRequest {
    blockHashes: Hash[];
  }
}
