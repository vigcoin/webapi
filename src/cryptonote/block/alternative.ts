import { IHash } from '../../crypto/types';
import { IBlock, IBlockVerificationContext } from '../../cryptonote/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';

export class AlternativeBlockchain {
  public static handle(
    context: P2pConnectionContext,
    id: IHash,
    block: IBlock,
    bvc: IBlockVerificationContext
  ): boolean {
    const height = context.blockchain.getHeightByBlock(block);
    if (height === 0) {
      logger.error(
        'Block with id: ' +
          id.toString('hex') +
          ' (as alternative) have wrong miner transaction'
      );
      bvc.verificationFailed = true;
      return false;
    }
  }
}
