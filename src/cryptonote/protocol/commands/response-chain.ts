import { IHash } from '@vigcoin/crypto';
import { BufferStreamReader, BufferStreamWriter } from '@vigcoin/serializer';
import { uint32 } from '@vigcoin/types';
import {
  BIN_KV_SERIALIZE_TYPE_STRING,
  BIN_KV_SERIALIZE_TYPE_UINT32,
  readJSON,
  writeJSONName,
  writeJSONObjectKeyValue,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../../../p2p/protocol/json';

import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSResponseChain {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 7,
  }
  export interface IRequest {
    blockHashes: IHash[];
    startHeight: uint32;
    totalHeight: uint32;
  }

  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      const blockHashes = [];
      const blockReader = new BufferStreamReader(json.m_block_ids);
      while (blockReader.getRemainedSize()) {
        blockHashes.push(blockReader.readHash());
      }
      return {
        blockHashes,
        startHeight: json.start_height,
        totalHeight: json.total_height,
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
        'start_height',
        data.startHeight,
        BIN_KV_SERIALIZE_TYPE_UINT32
      );
      writeJSONObjectKeyValue(
        writer,
        'total_height',
        data.totalHeight,
        BIN_KV_SERIALIZE_TYPE_UINT32
      );
      writeJSONName(writer, 'm_block_ids');
      const inner = new BufferStreamWriter(Buffer.alloc(0));
      for (const hash of data.blockHashes) {
        inner.writeHash(hash);
      }
      writer.writeUInt8(BIN_KV_SERIALIZE_TYPE_STRING);
      writeJSONVarint(writer, inner.getBuffer().length);
      writer.write(inner.getBuffer());
    }
  }
}
