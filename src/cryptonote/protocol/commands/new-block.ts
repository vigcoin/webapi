import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE, IBlockCompletEntry } from '../defines';

// tslint:disable-next-line:no-namespace
namespace NSNewBlock {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 1,
  }
  export interface IRequest {
    blockCompleteEntry: IBlockCompletEntry;
    currentBlockHeight: uint32;
    hop: uint32;
  }
}
