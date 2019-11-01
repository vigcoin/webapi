import { parameters } from '../../config';
import { IHash } from '../../crypto/types';
import { IBlock, IBlockVerificationContext } from '../../cryptonote/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { medianValue } from '../../util/math';
import { Difficulty } from '../difficulty';
import { IBlockEntry, uint64, usize } from '../types';
import { Block } from './block';
import { TransactionValidator } from '../transaction/validator';

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

    const cumulativeSize = context.blockchain.getCumulativeSize(context, block);

    if (cumulativeSize === false) {
      logger.info(
        'Block with id: ' +
          id +
          ' has at least one unknown transaction. Cumulative size is calculated imprecisely'
      );
    }

    if (
      !context.blockchain.checkCumulativeSize(
        id,
        cumulativeSize as usize,
        height
      )
    ) {
      bvc.verificationFailed = true;
      return false;
    }

    // block is not related with head of main chain
    // first of all - look in alternative chains container

    const mainHeight = context.blockchain.getHeightByIndex(id);

    const alternativeBlock = context.blockchain.alternativeChain.get(id);

    if (mainHeight === -1 && !alternativeBlock) {
      // block orphaned
      bvc.markedAsOrphaned = true;
      logger.info('Block recognized as orphaned and rejected, id = ' + id);
    } else {
      return AlternativeBlockchain.handleNewBlock(
        context,
        id,
        block,
        mainHeight,
        bvc
      );
    }

    return true;
  }

  public static handleNewBlock(
    context: P2pConnectionContext,
    id: IHash,
    block: IBlock,
    mainHeight: uint64,
    bvc: IBlockVerificationContext
  ): boolean {
    // we have new block in alternative chain
    // build alternative subchain, front -> mainchain, back -> alternative head

    const alterChain: IBlockEntry[] = [];
    const timestampes = [];

    let iter = context.blockchain.alternativeChain.get(id);
    while (iter) {
      alterChain.push(iter);
      timestampes.push(iter.block.header.timestamp);
      iter = context.blockchain.alternativeChain.get(iter.block.header.preHash);
    }

    if (alterChain.length) {
      // make sure that it has right connection to main chain
      if (context.blockchain.height <= alterChain.length) {
        logger.error('main blockchain wrong height');
        return false;
      }
      const be = alterChain[alterChain.length - 1];
      const preHash = Block.hash(context.blockchain.get(be.height - 1).block);
      if (!preHash.equals(be.block.header.preHash)) {
        logger.error('alternative chain have wrong connection to main chain');
        return false;
      }
      AlternativeBlockchain.completeTimestampVector(
        context,
        be.height - 1,
        timestampes
      );
    } else {
      if (!mainHeight) {
        logger.error(
          'Internal error: broken imperative condition it_main_prev != m_blocks_index.end()!'
        );
        return false;
      }
      AlternativeBlockchain.completeTimestampVector(
        context,
        mainHeight,
        timestampes
      );
    }

    // Check Timestamp correctness

    if (!AlternativeBlockchain.checkBlockTimestamp(block, timestampes)) {
      logger.info(
        'Block with id: ' +
          id +
          '\n' +
          ' for alternative chain, have invalid timestamp: ' +
          block.header.timestamp
      );
      // add_block_as_invalid(b, id);
      // Do not add blocks to invalid storage before proof of work check was passed

      bvc.verificationFailed = true;
      return false;
    }

    const height = alterChain.length ? iter.height + 1 : mainHeight + 1;

    if (!context.blockchain.checkpoint.check(height, id)) {
      logger.error('CHECKPOINT VALIDATION FAILED');
      bvc.verificationFailed = true;
      return false;
    }

    // Always check PoW for alternative blocks

    const currentDifficulty = Difficulty.nextDifficultyForAlternativeChain(
      context,
      alterChain,
      height
    );
    if (!currentDifficulty) {
      logger.error('!!!!!!! DIFFICULTY OVERHEAD !!!!!!!');
      return false;
    }

    if (!context.blockchain.checkProofOfWork(block, currentDifficulty)) {
      logger.info('Block with id: ' + id);
      logger.info(
        ' for alternative chain, have not enough proof of work: ' +
          context.blockchain.getLongHash(block)
      );
      logger.info(' expected difficulty: ' + currentDifficulty);
      bvc.verificationFailed = true;
      return false;
    }

    if (!TransactionValidator.prevalidateMiner(block, height)) {
      logger.info(
        'Block with id: ' +
          id.toString('hex') +
          ' (as alternative) have wrong miner transaction.'
      );
      bvc.verificationFailed = true;
      return false;
    }

    let cumulativeDifficulty = alterChain.length
      ? iter.difficulty
      : context.blockchain.get(mainHeight).difficulty;
    cumulativeDifficulty += currentDifficulty;

    const newBe: IBlockEntry = {
      block,
      height,
      // tslint:disable-next-line:object-literal-sort-keys
      difficulty: currentDifficulty,
      generatedCoins: 0,
      size: 0,
      transactions: [],
    };

    context.blockchain.alternativeChain.set(id, newBe);
    alterChain.push(newBe);

    // if (is_a_checkpoint) {
    //   //do reorganize!
    //   logger(INFO, BRIGHT_GREEN) <<
    //     "###### REORGANIZE on height: " << alt_chain.front() -> second.height << " of " << m_blocks.size() - 1 <<
    //     ", checkpoint is found in alternative chain on height " << bei.height;
    //   bool r = switch_to_alternative_blockchain(alt_chain, true);
    //   if (r) {
    //     bvc.m_added_to_main_chain = true;
    //     bvc.m_switched_to_alt_chain = true;
    //   } else {
    //     bvc.m_verifivation_failed = true;
    //   }
    //   return r;
    // } else if (m_blocks.back().cumulative_difficulty < bei.cumulative_difficulty) //check if difficulty bigger then in main chain
    // {
    //   //do reorganize!
    //   logger(INFO, BRIGHT_GREEN) <<
    //     "###### REORGANIZE on height: " << alt_chain.front() -> second.height << " of " << m_blocks.size() - 1 << " with cum_difficulty " << m_blocks.back().cumulative_difficulty
    //     << ENDL << " alternative blockchain size: " << alt_chain.size() << " with cum_difficulty " << bei.cumulative_difficulty;
    //   bool r = switch_to_alternative_blockchain(alt_chain, false);
    //   if (r) {
    //     bvc.m_added_to_main_chain = true;
    //     bvc.m_switched_to_alt_chain = true;
    //   } else {
    //     bvc.m_verifivation_failed = true;
    //   }
    //   return r;
    // } else {
    //   logger(INFO, BRIGHT_BLUE) <<
    //     "----- BLOCK ADDED AS ALTERNATIVE ON HEIGHT " << bei.height
    //     << ENDL << "id:\t" << id
    //     << ENDL << "PoW:\t" << proof_of_work
    //     << ENDL << "difficulty:\t" << current_diff;
    //   if (sendNewAlternativeBlockMessage) {
    //     sendMessage(BlockchainMessage(NewAlternativeBlockMessage(id)));
    //   }
    //   return true;
    // }
    return true;
  }

  public static checkBlockTimestamp(block: IBlock, timestamps: uint64[]) {
    if (timestamps.length < parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW) {
      return true;
    }
    const mediaTime = medianValue(timestamps);
    if (block.header.timestamp < mediaTime) {
      logger.info(
        'Timestamp of block with id: ' +
          Block.hash(block).toString('hex') +
          ', ' +
          block.header.timestamp +
          ', less than median of last ' +
          parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW +
          ' blocks, ' +
          mediaTime
      );
      return false;
    }
    return true;
  }

  public static completeTimestampVector(
    context: P2pConnectionContext,
    startTopHeight: uint64,
    timestamps: uint64[]
  ) {
    if (timestamps.length >= parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW) {
      return true;
    }
    if (startTopHeight >= context.blockchain.height) {
      logger.error(
        'internal error: passed start_height = ' +
          startTopHeight +
          ' not less then m_blocks.size()=' +
          context.blockchain.height
      );
      return false;
    }
    const neededSize =
      parameters.BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW - timestamps.length;
    const stopOffset =
      startTopHeight > neededSize ? startTopHeight - neededSize : 0;
    do {
      const be = context.blockchain.get(startTopHeight);
      timestamps.push(be.block.header.timestamp);
      if (startTopHeight === 0) {
        break;
      }
      --startTopHeight;
    } while (startTopHeight !== stopOffset);
    return true;
  }
}
