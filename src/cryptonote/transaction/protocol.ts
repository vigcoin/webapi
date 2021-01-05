import { Block } from '@vigcoin/block';
import { IHash } from '@vigcoin/crypto';
import { BufferStreamReader, BufferStreamWriter } from '@vigcoin/serializer';
import { Transaction } from '@vigcoin/transaction';
import {
  IBlock,
  IBlockVerificationContext,
  ITxVerificationContext,
} from '@vigcoin/types';
import { parameters } from '../../config';
import { logger } from '../../logger';
import { P2pConnectionContext } from '../../p2p/connection';
import { NSNewBlock } from '../protocol/commands/new-block';
import { IBlockCompletEntry } from '../protocol/defines';

import { TransactionValidator } from './validator';

export class TransactionProtocol {
  public static onIncomingBlob(
    context: P2pConnectionContext,
    blockBuffer: Buffer,
    bvc: IBlockVerificationContext,
    minerControl: boolean,
    relayBlock: boolean
  ): boolean {
    if (blockBuffer.length > parameters.CRYPTONOTE_MAX_BLOCK_BLOB_SIZE) {
      logger.info(
        'WRONG BLOCK BLOB, too big size ' + blockBuffer.length + ', rejected'
      );
      return false;
    }
    try {
      const block: IBlock = Block.readBlock(
        new BufferStreamReader(blockBuffer)
      );
      if (minerControl) {
        // context.blockchain.stopMining();
      }
      context.blockchain.addNew(context, block, bvc);
      if (minerControl) {
        // context.blockchain.update_block_template_and_resume_mining();
      }

      if (relayBlock && bvc.addedToMainChain) {
        const result = context.blockchain.getTransactions(
          context,
          block.transactionHashes
        );
        if (
          !result.missedTxs.length &&
          context.blockchain
            .getBlockIdByHeight(context.blockchain.getHeightByBlock(block))
            .equals(Block.hash(block))
        ) {
          logger.info(
            'Block added, but it seems that reorganize just happened after that, do not relay this block'
          );
        } else {
          if (
            !(
              result.blockTxs.length === block.transactionHashes.length &&
              result.missedTxs.length === 0
            )
          ) {
            logger.error(
              "can't find some transactions in found block:" +
                Block.hash(block) +
                ' txs.size()=' +
                result.blockTxs.length +
                ', b.transactionHashes.size()=' +
                block.transactionHashes.length +
                ', missed_txs.size()' +
                result.missedTxs.length
            );
            return false;
          }

          const txs = [];
          for (const tx of result.blockTxs) {
            txs.push(Transaction.toBuffer(tx).toString('hex'));
          }
          const be: IBlockCompletEntry = {
            block: blockBuffer,
            txs,
          };
          const request: NSNewBlock.IRequest = {
            blockCompleteEntry: be,
            currentBlockHeight: context.blockchain.height,
            hop: 0,
          };
          const writer = new BufferStreamWriter();
          NSNewBlock.Writer.request(writer, request);
          context.cm.relay(writer.getBuffer());
        }
      }
      return true;
    } catch (e) {
      logger.info('Failed to parse and validate new block');
      return false;
    }
  }

  public static onIncoming(
    context: P2pConnectionContext,
    tx: Buffer,
    keptByBlock: boolean
  ): boolean {
    if (tx.length >= parameters.CRYPTONOTE_MAX_TX_SIZE) {
      logger.info(
        'WRONG TRANSACTION BLOB, too big size ' + tx.length + ', rejected!'
      );
      return false;
    }
    try {
      return TransactionProtocol.onIncomingSecond(context, tx, keptByBlock);
    } catch (e) {
      logger.info('WRONG TRANSACTION BLOB, Failed to parse, rejected!');
      return false;
    }
  }

  public static onIncomingSecond(
    context: P2pConnectionContext,
    txBuffer: Buffer,
    keptByBlock: boolean
  ): boolean {
    // if (!check_tx_syntax(tx)) {
    //   logger(INFO) << "WRONG TRANSACTION BLOB, Failed to check tx " << txHash << " syntax, rejected";
    //   tvc.m_verifivation_failed = true;
    //   return false;
    // }

    const transaction = Transaction.read(new BufferStreamReader(txBuffer));
    const hash = Transaction.hash(transaction);
    if (!TransactionValidator.checkSematic(transaction)) {
      logger.info(
        'WRONG TRANSACTION BLOB, Failed to check tx ' +
          hash +
          ' semantic, rejected'
      );
      return false;
    }
    return this.addNewTx(context, txBuffer, hash, keptByBlock);
  }

  public static addNewTx(
    context: P2pConnectionContext,
    txBuffer: Buffer,
    hash: IHash,
    keptByBlock: boolean
  ): boolean {
    if (context.blockchain.haveTransaction(hash)) {
      logger.info('tx ' + hash + ' is already in blockchain');
      return true;
    }
    if (context.mempool.haveTx(hash)) {
      logger.info('tx ' + hash + ' is already in already in transaction pool');
      return true;
    }
    const tvc: ITxVerificationContext = {
      addedToPool: false,
      shouldBeRelayed: false,
      txFeeTooSmall: false,
      verifivationFailed: false,
      verifivationImpossible: false,
    };
    return context.mempool.addTxBuffer(context, txBuffer, tvc, keptByBlock);
  }
}
