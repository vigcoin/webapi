import { Hash } from '../../../crypto/types';
import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE, IBlockCompletEntry } from '../defines';

// tslint:disable-next-line:no-namespace
namespace NSResponseGetObjects {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 4,
  }
  export interface IRequest {
    txs: Hash[],
    blocks: IBlockCompletEntry[],
    missedHashes: Hash[],
    currentBlockchainHeight: uint32
  }
}