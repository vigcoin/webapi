import { IHash } from '@vigcoin/crypto';
import {
  IBlock,
  IBlockEntry,
  IBlockVerificationContext,
  uint64,
  usize,
} from '@vigcoin/types';
import { parameters } from '../../config';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { medianValue } from '../../util/math';
import { Difficulty } from '../difficulty';
import { BLOCKCHAIN_EVENT_CHAIN_SWITCHED } from '../events';
import { TransactionValidator } from '../transaction/validator';
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

    const alterChains: IBlockEntry[] = [];
    const timestampes = [];

    let iter = context.blockchain.alternativeChain.get(id);
    while (iter) {
      alterChains.push(iter);
      timestampes.push(iter.block.header.timestamp);
      iter = context.blockchain.alternativeChain.get(iter.block.header.preHash);
    }

    if (alterChains.length) {
      // make sure that it has right connection to main chain
      if (context.blockchain.height <= alterChains.length) {
        logger.error('main blockchain wrong height');
        return false;
      }
      const be = alterChains[alterChains.length - 1];
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

    const height = alterChains.length ? iter.height + 1 : mainHeight + 1;
    const isACheckpoint = context.blockchain.checkpoint.check(height, id);

    // Always check PoW for alternative blocks

    const currentDifficulty = Difficulty.nextDifficultyForAlternativeChain(
      context,
      alterChains,
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

    let cumulativeDifficulty = alterChains.length
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
    alterChains.push(newBe);

    if (isACheckpoint) {
      // Do reorganization!
      logger.info(
        '###### REORGANIZE on height: ' +
          alterChains[0].height +
          ' of ' +
          (context.blockchain.height - 1) +
          ', checkpoint is found in alternative chain on height ' +
          newBe.height
      );
      if (AlternativeBlockchain.switchTo(context, alterChains, true)) {
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
            alterChains[0].height +
            ' of ' +
            (context.blockchain.height - 1) +
            ' with cum_difficulty ' +
            context.blockchain.get(context.blockchain.height).difficulty
        );

        logger.info(
          ' alternative blockchain size: ' +
            alterChains.length +
            ' with cum_difficulty ' +
            newBe.difficulty
        );
        if (AlternativeBlockchain.switchTo(context, alterChains, true)) {
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
    alterChains: IBlockEntry[],
    discardDisconnected: boolean
  ): boolean {
    if (!alterChains.length) {
      logger.error('Empty chain!');
      return false;
    }

    const splitHeight = alterChains[0].height;
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

    // Connecting new alternative chain

    for (const alter of alterChains) {
      const bvc: IBlockVerificationContext = {
        addedToMainChain: false,
        alreadyExists: false,
        markedAsOrphaned: false,
        switchedToAltChain: false,
        verificationFailed: false,
      };
      const res = context.blockchain.pushBlock(context, alter.block, bvc);

      if (!res || !bvc.addedToMainChain) {
        logger.info('Failed to switch to alternative blockchain');
        AlternativeBlockchain.rollback(context, disconnectedChain, splitHeight);
        logger.info(
          'The block was inserted as invalid while connecting new alternative chain,  block_id: ' +
            Block.hash(alter.block)
        );
        const hash = Block.hash(alter.block);
        context.blockchain.orphanBlocks.delete(hash);
        context.blockchain.alternativeChain.delete(hash);
        return false;
      }
    }

    if (!discardDisconnected) {
      // pushing old chain as alternative chain
      for (const disconnected of disconnectedChain) {
        const bvc: IBlockVerificationContext = {
          addedToMainChain: false,
          alreadyExists: false,
          markedAsOrphaned: false,
          switchedToAltChain: false,
          verificationFailed: false,
        };
        const res = AlternativeBlockchain.handle(
          context,
          Block.hash(disconnected),
          disconnected,
          bvc,
          false
        );
        if (!res) {
          logger.error(
            'Failed to push ex-main chain blocks to alternative chain '
          );
          AlternativeBlockchain.rollback(
            context,
            disconnectedChain,
            splitHeight
          );
          return false;
        }
      }
    }

    const blocksFromCommonRoot: IHash[] = [];
    // removing all_chain entries from alternative chain

    for (const alter of alterChains) {
      const hash = Block.hash(alter.block);
      blocksFromCommonRoot.push(hash);
      context.blockchain.orphanBlocks.delete(hash);
      context.blockchain.alternativeChain.delete(hash);
    }

    context.blockchain.emit(
      BLOCKCHAIN_EVENT_CHAIN_SWITCHED,
      blocksFromCommonRoot
    );

    logger.info(
      'REORGANIZE SUCCESS! on height: ' +
        splitHeight +
        ', new blockchain size: ' +
        context.blockchain.height
    );
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

  public static rollback(
    context: P2pConnectionContext,
    originalChain: IBlock[],
    rollbackHeight: usize
  ) {
    // remove failed subchain
    for (let i = context.blockchain.height - 1; i >= rollbackHeight; i--) {
      context.blockchain.pop(context, i);
    }
    // return back original chain
    for (const block of originalChain) {
      const bvc: IBlockVerificationContext = {
        addedToMainChain: false,
        alreadyExists: false,
        markedAsOrphaned: false,
        switchedToAltChain: false,
        verificationFailed: false,
      };
      const res = context.blockchain.pushBlock(context, block, bvc);
      if (!(res && bvc.addedToMainChain)) {
        logger.error(
          'PANIC!!! failed to add (again) block while chain switching during the rollback!'
        );
        return false;
      }
    }
    logger.info('Rollback success.');
    return true;
  }

  private chain: Map<IHash, IBlockEntry> = new Map();
}
