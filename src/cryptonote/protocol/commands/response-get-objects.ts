import { Hash } from '../../../crypto/types';
import {
  BIN_KV_SERIALIZE_FLAG_ARRAY,
  BIN_KV_SERIALIZE_TYPE_OBJECT,
  BIN_KV_SERIALIZE_TYPE_STRING,
  BIN_KV_SERIALIZE_TYPE_UINT32,
  readJSON,
  writeJSONName,
  writeJSONObjectKeyValue,
  writeJSONVarint,
  writeKVBlockHeader,
  writeTXList,
} from '../../../p2p/protocol/json';
import { BufferStreamReader } from '../../serialize/reader';
import { BufferStreamWriter } from '../../serialize/writer';
import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE, IBlockCompletEntry } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSResponseGetObjects {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 4,
  }
  export interface IRequest {
    txs?: Hash[];
    blocks?: IBlockCompletEntry[];
    missedHashes?: Hash[];
    currentBlockchainHeight: uint32;
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      const request: IRequest = {
        currentBlockchainHeight: json.current_blockchain_height,
      };
      const kvPair = [
        { from: 'blocks', to: 'blocks' },
        { from: 'txs', to: 'txs' },
        { from: 'missed_ids', to: 'missedHashes' },
      ];

      for (const kv of kvPair) {
        if (json[kv.from]) {
          request[kv.to] = json[kv.from];
        }
      }
      return request;
    }
  }
  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      if (data.txs) {
        writeTXList(writer, 'txs', data.txs);
      }
      if (data.blocks) {
        writeJSONName(writer, 'blocks');
        writer.writeUInt8(
          // tslint:disable-next-line:no-bitwise
          BIN_KV_SERIALIZE_TYPE_OBJECT | BIN_KV_SERIALIZE_FLAG_ARRAY
        );
        writeJSONVarint(writer, data.blocks.length);
        for (const block of data.blocks) {
          writeJSONVarint(writer, Object.keys(block).length);
          if (block.block) {
            writeJSONName(writer, 'block');
            writer.writeUInt8(BIN_KV_SERIALIZE_TYPE_STRING);
            writeJSONVarint(writer, block.block.length);
            writer.write(block.block);
          }
          if (block.txs) {
            writeTXList(writer, 'txs', block.txs);
          }
        }
      }
      if (data.missedHashes) {
        writeTXList(writer, 'missed_ids', data.missedHashes);
      }
      writeJSONObjectKeyValue(
        writer,
        'current_blockchain_height',
        data.currentBlockchainHeight,
        BIN_KV_SERIALIZE_TYPE_UINT32
      );
    }
  }
}
