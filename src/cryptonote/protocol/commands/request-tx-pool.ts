import { Hash } from '../../../crypto/types';
import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
namespace NSRequestTXPool {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 8,
  }
  export interface IRequest {
    txs: Hash[]
  }
}