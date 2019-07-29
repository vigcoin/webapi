import { Hash } from '../../../crypto/types';
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
export namespace NSRequestChain {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 6,
  }
  export interface IRequest {
    blockHashes?: Hash[];
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      if (json.block_ids) {
        return {
          blockHashes: json.block_ids
        }
      }
      return json;
    }
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      if (data.blockHashes) {
        writeTXList(writer, 'block_ids', data.blockHashes);
      }
    }
  }
}
