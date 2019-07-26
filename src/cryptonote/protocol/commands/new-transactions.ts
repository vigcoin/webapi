import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE, IBlockCompletEntry } from '../defines';

// tslint:disable-next-line:no-namespace
namespace NSNewTransactions {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 2,
  }
  export interface IRequest {
    txs: string[]
  }
}