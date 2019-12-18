import { IHash } from '@vigcoin/crypto';
import {
  BIN_KV_SERIALIZE_FLAG_ARRAY,
  BIN_KV_SERIALIZE_TYPE_STRING,
  readJSON,
  writeJSONName,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../../../p2p/protocol/json';
import { BufferStreamReader } from '../../serialize/reader';
import { BufferStreamWriter } from '../../serialize/writer';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSNewTransactions {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 2,
  }
  export interface IRequest {
    txs: IHash[];
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      return {
        txs: json.txs,
      };
    }
  }
  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONName(writer, 'txs');
      writer.writeUInt8(
        // tslint:disable-next-line:no-bitwise
        BIN_KV_SERIALIZE_TYPE_STRING | BIN_KV_SERIALIZE_FLAG_ARRAY
      );
      writeJSONVarint(writer, data.txs.length);
      for (const tx of data.txs) {
        writeJSONVarint(writer, tx.length);
        writer.write(tx);
      }
    }
  }
}
