import { IHash } from '@vigcoin/crypto';
import * as assert from 'assert';
import {
  BIN_KV_SERIALIZE_TYPE_STRING,
  readJSON,
  readJSONVarint,
  writeJSONName,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../../../p2p/protocol/json';
import { BufferStreamReader } from '../../serialize/reader';
import { BufferStreamWriter } from '../../serialize/writer';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSRequestTXPool {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 8,
  }
  export interface IRequest {
    txs?: IHash[];
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      if (json.txs) {
        const inner = new BufferStreamReader(json.txs);
        const txs = [];
        while (inner.getRemainedSize()) {
          const type = inner.readInt8();
          assert(type === BIN_KV_SERIALIZE_TYPE_STRING);
          const length = readJSONVarint(inner);
          const buffer = inner.read(length);
          txs.push(buffer);
        }
        return {
          txs,
        };
      }
      return {};
    }
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      if (data.txs && data.txs.length > 0) {
        writeJSONName(writer, 'txs');
        const inner = new BufferStreamWriter(Buffer.alloc(0));
        for (const tx of data.txs) {
          inner.writeUInt8(BIN_KV_SERIALIZE_TYPE_STRING);
          writeJSONVarint(inner, tx.length);
          inner.write(tx);
        }
        writer.writeUInt8(BIN_KV_SERIALIZE_TYPE_STRING);
        writeJSONVarint(writer, inner.getBuffer().length);
        writer.write(inner.getBuffer());
      }
    }
  }
}
