import { Hash } from '../../../crypto/types';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
namespace NSRequestGetObjects {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 3,
  }
  export interface IRequest {
    txs: Hash[],
    blocks: Hash[]
  }
}