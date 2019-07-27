import {
  BIN_KV_SERIALIZE_TYPE_OBJECT,
  BIN_KV_SERIALIZE_TYPE_STRING,
  BIN_KV_SERIALIZE_TYPE_UINT32,
  readJSON,
  writeJSONName,
  writeJSONObjectKeyValue,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../../../p2p/protocol/json';
import { BufferStreamReader } from '../../serialize/reader';
import { BufferStreamWriter } from '../../serialize/writer';
import { uint32 } from '../../types';
import { CN_COMMANDS_POOL_BASE, IBlockCompletEntry } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSNewBlock {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 1,
  }
  export interface IRequest {
    blockCompleteEntry: IBlockCompletEntry;
    currentBlockHeight: uint32;
    hop: uint32;
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      const blockCompleteEntry: IBlockCompletEntry = {
        block: json.b.block,
      };
      if (json.b.txs) {
        blockCompleteEntry.txs = json.b.txs;
      }
      return {
        blockCompleteEntry,
        currentBlockHeight: json.current_blockchain_height,
        hop: json.hop,
      };
    }
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONObjectKeyValue(
        writer,
        'b',
        data.blockCompleteEntry,
        BIN_KV_SERIALIZE_TYPE_OBJECT
      );
      const count = Object.keys(data.blockCompleteEntry).length;

      writeJSONVarint(writer, count);

      writeJSONObjectKeyValue(
        writer,
        'block',
        data.blockCompleteEntry.block,
        BIN_KV_SERIALIZE_TYPE_STRING
      );
      if (data.blockCompleteEntry.txs) {
        writeJSONName(writer, 'txs');
        const inner = new BufferStreamWriter(Buffer.alloc(0));
        for (const tx of data.blockCompleteEntry.txs) {
          inner.writeUInt8(BIN_KV_SERIALIZE_TYPE_STRING);
          writeJSONVarint(inner, tx.length);
          inner.write(tx);
        }
        writer.writeUInt8(BIN_KV_SERIALIZE_TYPE_STRING);
        writeJSONVarint(writer, inner.getBuffer().length);
        writer.write(inner.getBuffer());
      }
      writeJSONObjectKeyValue(
        writer,
        'current_blockchain_height',
        data.currentBlockHeight,
        BIN_KV_SERIALIZE_TYPE_UINT32
      );
      writeJSONObjectKeyValue(
        writer,
        'hop',
        data.hop,
        BIN_KV_SERIALIZE_TYPE_UINT32
      );
    }
  }
}
