import * as assert from 'assert';
import { parameters } from '../config';
import { CryptonoteDifficulty } from '../crypto/types';
import { logger } from '../logger';
import { P2pConnectionContext } from '../p2p/connection';
import { IBlockEntry, uint64 } from './types';

export class Difficulty {
  public static blocksCount() {
    return parameters.DIFFICULTY_CUT + parameters.DIFFICULTY_LAG;
  }

  public static next(timestamps: uint64[], cumulativeDifficulties: uint64[]) {
    const target = parameters.DIFFICULTY_TARGET;
    const win = parameters.DIFFICULTY_WINDOW;
    const cut = parameters.DIFFICULTY_CUT;
    const lag = parameters.DIFFICULTY_LAG;

    const diff = new CryptonoteDifficulty(target, cut, lag, win);
    return diff.next(timestamps, cumulativeDifficulties);
  }
  public static nextDifficultyForAlternativeChain(
    context: P2pConnectionContext,
    alterChain: IBlockEntry[],
    height: uint64
  ) {
    const timestamps: uint64[] = [];
    const cumulativeDifficulties: uint64[] = [];
    const blocksCount = Difficulty.blocksCount();

    if (alterChain.length < blocksCount) {
      const front = alterChain[alterChain.length - 1];
      const mainChainStopOffset = alterChain.length ? front.height : height;
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

  public static nextDifficultyForBlock(context: P2pConnectionContext) {
    let offset = 0;
    if (context.blockchain.height > Difficulty.blocksCount()) {
      offset = context.blockchain.height - Difficulty.blocksCount();
    }

    if (offset === 0) {
      ++offset;
    }

    const timestamps = [];
    const cumulativeDifficulties = [];

    for (; offset < context.blockchain.height; offset++) {
      const be = context.blockchain.get(offset);
      timestamps.push(be.block.header.timestamp);
      cumulativeDifficulties.push(be.difficulty);
    }
    return Difficulty.next(timestamps, cumulativeDifficulties);
  }
}
