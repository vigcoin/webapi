import { parameters } from '../../config';
import { IHash } from '../../crypto/types';
import { IBlock, IBlockVerificationContext } from '../../cryptonote/types';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { medianValue } from '../../util/math';
import { Difficulty } from '../difficulty';
import { TransactionValidator } from '../transaction/validator';
import { IBlockEntry, uint64, usize } from '../types';
import { Block } from './block';
import { BlockchainMessage, EBlockchainMessage } from './messages';

export class AlternativeBlockchain {
  public static handle(
    context: P2pConnectionContext,
    id: IHash,
    block: IBlock,
    bvc: IBlockVerificationContext,
    send: boolean
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

    if (
      !context.blockchain.checkpoint.isAllowed(
        context.blockchain.height,
        height
      )
    ) {
      logger.info('Block with id: ' + id.toString('hex'));
      logger.info(
        " can't be accepted for alternative chain, block height: " + height
      );
      logger.info(' blockchain height: ' + context.blockchain.height);
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
        bvc,
        send
      );
    }

    return true;
  }

  public static handleNewBlock(
    context: P2pConnectionContext,
    id: IHash,
    block: IBlock,
    mainHeight: uint64,
    bvc: IBlockVerificationContext,
    send: boolean
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
    const isACheckpoint = context.blockchain.checkpoint.check(height, id);

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
      difficulty: cumulativeDifficulty,
      generatedCoins: 0,
      size: 0,
      transactions: [],
    };

    context.blockchain.alternativeChain.set(id, newBe);
    alterChain.push(newBe);

    if (isACheckpoint) {
      // Do reorganization!
      logger.info(
        '###### REORGANIZE on height: ' +
          alterChain[0].height +
          ' of ' +
          (context.blockchain.height - 1) +
          ', checkpoint is found in alternative chain on height ' +
          newBe.height
      );
      if (AlternativeBlockchain.switchTo(context, alterChain, true)) {
        bvc.addedToMainChain = true;
        bvc.switchedToAltChain = true;
        return true;
      } else {
        bvc.verificationFailed = true;
        return false;
      }
    } else {
      // Check if difficulty bigger than in the main chain
      if (
        context.blockchain.get(context.blockchain.height).difficulty <
        newBe.difficulty
      ) {
        // Do reorganization!
        logger.info(
          '###### REORGANIZE on height: ' +
            alterChain[0].height +
            ' of ' +
            (context.blockchain.height - 1) +
            ' with cum_difficulty ' +
            context.blockchain.get(context.blockchain.height).difficulty
        );

        logger.info(
          ' alternative blockchain size: ' +
            alterChain.length +
            ' with cum_difficulty ' +
            newBe.difficulty
        );
        if (AlternativeBlockchain.switchTo(context, alterChain, true)) {
          bvc.addedToMainChain = true;
          bvc.switchedToAltChain = true;
          return true;
        } else {
          bvc.verificationFailed = true;
          return false;
        }
      } else {
        logger.info(
          '----- BLOCK ADDED AS ALTERNATIVE ON HEIGHT ' + newBe.height
        );
        logger.info('id:\t' + id);
        logger.info(
          'PoW: \t' + context.blockchain.getLongHash(block).toString('hex')
        );
        logger.info('Difficulty :\t' + currentDifficulty);
        if (send) {
          const messager = new BlockchainMessage(
            EBlockchainMessage.NEW_ALTERNATIVE_BLOCK_MESSAGE
          );
          messager.send();
        }
        return true;
      }
    }
  }

  public static switchTo(
    context: P2pConnectionContext,
    alterChain: IBlockEntry[],
    discardDisconnected: boolean
  ): boolean {
    if (!alterChain.length) {
      logger.error('Empty chain!');
      return false;
    }

    const splitHeight = alterChain[0].height;
    if (context.blockchain.height < splitHeight) {
      logger.error(
        'switch_to_alternative_blockchain: blockchain size is lower than split height'
      );
      return false;
    }

    // Disconnect old chain

    const disconnectedChain: IBlock[] = [];
    for (let i = context.blockchain.height - 1; i >= splitHeight; i--) {
      const block = context.blockchain.pop(context, i);
      disconnectedChain.push(block);
    }

    // //disconnecting old chain
    // std::list<block_t> disconnected_chain;
    // for (size_t i = m_blocks.size() - 1; i >= split_height; i--) {
    //   block_t b = m_blocks[i].bl;
    //   popBlock(Block::getHash(b));
    //   //if (!(r)) { logger(ERROR, BRIGHT_RED) << "failed to remove block on chain switching"; return false; }
    //   disconnected_chain.push_front(b);
    // }

    // //connecting new alternative chain
    // for (auto alt_ch_iter = alt_chain.begin(); alt_ch_iter != alt_chain.end(); alt_ch_iter++) {
    //   auto ch_ent = *alt_ch_iter;
    //   block_verification_context_t bvc = boost::value_initialized<block_verification_context_t>();
    //   bool r = pushBlock(ch_ent->second.bl, bvc);
    //   if (!r || !bvc.m_added_to_main_chain) {
    //     logger(INFO, BRIGHT_WHITE) << "Failed to switch to alternative blockchain";
    //     rollback_blockchain_switching(disconnected_chain, split_height);
    //     //add_block_as_invalid(ch_ent->second, Block::getHash(ch_ent->second.bl));
    //     logger(INFO, BRIGHT_WHITE) << "The block was inserted as invalid while connecting new alternative chain,  block_id: " << Block::getHash(ch_ent->second.bl);
    //     m_orthanBlocksIndex.remove(ch_ent->second.bl);
    //     m_alternative_chains.erase(ch_ent);

    //     for (auto alt_ch_to_orph_iter = ++alt_ch_iter; alt_ch_to_orph_iter != alt_chain.end(); alt_ch_to_orph_iter++) {
    //       //block_verification_context_t bvc = boost::value_initialized<block_verification_context_t>();
    //       //add_block_as_invalid((*alt_ch_iter)->second, (*alt_ch_iter)->first);
    //       m_orthanBlocksIndex.remove((*alt_ch_to_orph_iter)->second.bl);
    //       m_alternative_chains.erase(*alt_ch_to_orph_iter);
    //     }

    //     return false;
    //   }
    // }

    // if (!discard_disconnected_chain) {
    //   //pushing old chain as alternative chain
    //   for (auto& old_ch_ent : disconnected_chain) {
    //     block_verification_context_t bvc = boost::value_initialized<block_verification_context_t>();
    //     bool r = handle_alternative_block(old_ch_ent, Block::getHash(old_ch_ent), bvc, false);
    //     if (!r) {
    //       logger(ERROR, BRIGHT_RED) << ("Failed to push ex-main chain blocks to alternative chain ");
    //       rollback_blockchain_switching(disconnected_chain, split_height);
    //       return false;
    //     }
    //   }
    // }

    // std::vector<hash_t> blocksFromCommonRoot;
    // blocksFromCommonRoot.reserve(alt_chain.size() + 1);
    // blocksFromCommonRoot.push_back(alt_chain.front()->second.bl.previousBlockHash);

    // //removing all_chain entries from alternative chain
    // for (auto ch_ent : alt_chain) {
    //   blocksFromCommonRoot.push_back(Block::getHash(ch_ent->second.bl));
    //   m_orthanBlocksIndex.remove(ch_ent->second.bl);
    //   m_alternative_chains.erase(ch_ent);
    // }

    // sendMessage(BlockchainMessage(ChainSwitchMessage(std::move(blocksFromCommonRoot))));

    // logger(INFO, BRIGHT_GREEN) << "REORGANIZE SUCCESS! on height: " << split_height << ", new blockchain size: " << m_blocks.size();
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
