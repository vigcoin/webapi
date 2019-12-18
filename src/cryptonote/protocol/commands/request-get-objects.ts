import { IHash } from '@vigcoin/crypto';
import {
  readJSON,
  writeJSONVarint,
  writeKVBlockHeader,
  writeTXList,
} from '../../../p2p/protocol/json';
import { BufferStreamReader } from '../../serialize/reader';
import { BufferStreamWriter } from '../../serialize/writer';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSRequestGetObjects {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 3,
  }
  export interface IRequest {
    txs?: IHash[];
    blocks?: IHash[];
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      return readJSON(reader);
    }
  }
  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      const keys = ['txs', 'blocks'];
      for (const key of keys) {
        if (data[key]) {
          writeTXList(writer, key, data[key]);
        }
      }
    }
  }
}
