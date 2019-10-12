import * as assert from 'assert';
import { parameters } from '../config';
import { logger } from '../logger';
import { P2pConnectionContext } from '../p2p/connection';
import { IBlockEntry, uint64 } from './types';

export class Difficulty {
  public static blocksCount() {
    return parameters.DIFFICULTY_CUT + parameters.DIFFICULTY_LAG;
  }
  public static nextDifficultyForAlternativeChain(
    context: P2pConnectionContext,
    alterChain: IBlockEntry[],
    be: IBlockEntry
  ) {
    const timestamps: uint64[] = [];
    const cumulativeDifficulties: uint64[] = [];
    const blocksCount = Difficulty.blocksCount();

    if (alterChain.length < blocksCount) {
      const front = alterChain[alterChain.length - 1];
      const mainChainStopOffset = alterChain.length ? front.height : be.height;
      let mainChainCount =
        blocksCount -
        (blocksCount > alterChain.length ? alterChain.length : blocksCount);
      if (mainChainCount > mainChainStopOffset) {
        mainChainCount = mainChainStopOffset;
      }
      let mainChainStartOffset = mainChainStopOffset - mainChainCount;
      if (!mainChainStartOffset) {
        mainChainStartOffset++;
      }
      for (
        ;
        mainChainStartOffset < mainChainStopOffset;
        mainChainStartOffset++
      ) {
        const mainChainBlockEntry = context.blockchain.get(
          mainChainStartOffset
        );
        const timestamp = mainChainBlockEntry.block.header.timestamp;
        timestamps.push(timestamp);
        cumulativeDifficulties.push(mainChainBlockEntry.difficulty);
      }
      if (alterChain.length + timestamps.length > Difficulty.blocksCount()) {
        logger.error(
          'Internal error, alt_chain.size()[' +
            alterChain.length +
            '] + timestamps.size()[' +
            timestamps.length +
            '] NOT <= m_currency.difficultyBlocksCount()[' +
            Difficulty.blocksCount() +
            ']'
        );
        return false;
      }
      for (const aci of alterChain) {
        timestamps.push(aci.block.header.timestamp);
        cumulativeDifficulties.push(aci.height);
      }
    } else {
      const size =
        blocksCount > alterChain.length ? alterChain.length : blocksCount;
      timestamps.splice(size);
      cumulativeDifficulties.splice(size);
      let count = 0;
      const maxI = size - 1;
      const reversed = alterChain.reverse();
      for (const item of reversed) {
        timestamps[maxI - count] = item.block.header.timestamp;
        count++;
        if (count >= blocksCount) {
          break;
        }
      }
    }
    return Difficulty.next(timestamps, cumulativeDifficulties);
  }

  public static next(timestamps: uint64[], cumulativeDifficulties: uint64[]) {
    assert(parameters.DIFFICULTY_WINDOW >= 2);
    if (timestamps.length > parameters.DIFFICULTY_WINDOW) {
      timestamps.splice(parameters.DIFFICULTY_WINDOW);
      cumulativeDifficulties.splice(parameters.DIFFICULTY_WINDOW);
    }
    const length = timestamps.length;
    assert(length === cumulativeDifficulties.length);
    assert(length <= parameters.DIFFICULTY_WINDOW);
    if (length <= 1) {
      return 1;
    }
    timestamps.sort();
    let cutBegin = 0;
    let cutEnd = 0;
    assert(2 * parameters.DIFFICULTY_CUT <= parameters.DIFFICULTY_WINDOW - 2);
    if (
      length <=
      parameters.DIFFICULTY_WINDOW - 2 * parameters.DIFFICULTY_CUT
    ) {
      cutBegin = 0;
      cutEnd = length;
    } else {
      cutBegin = Math.floor(
        (length -
          (parameters.DIFFICULTY_WINDOW - 2 * parameters.DIFFICULTY_CUT) +
          1) /
          2
      );
      cutEnd =
        cutBegin +
        (parameters.DIFFICULTY_WINDOW - 2 * parameters.DIFFICULTY_CUT);
    }

    assert(cutBegin + 2 <= cutEnd && cutEnd <= length);
    let timeSpan = timestamps[cutEnd - 1] - timestamps[cutBegin];
    if (timeSpan === 0) {
      timeSpan = 1;
    }
    const totalWork =
      cumulativeDifficulties[cutEnd - 1] - cumulativeDifficulties[cutBegin];
    assert(totalWork > 0);
    const low = 0;
    const high = 0;
    // TODO: mul128
    // low = 0;
    if (high !== 0 || low + timeSpan - 1 < low) {
      return 0;
    }

    return (low + timeSpan - 1) / timeSpan;
  }
}
