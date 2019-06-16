import { IPeerIDType } from '../../cryptonote/p2p';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { P2P_COMMAND_ID_BASE } from './defines';
import {
  BIN_KV_SERIALIZE_TYPE_STRING,
  BIN_KV_SERIALIZE_TYPE_UINT64,
  writeJSONObjectKeyValue,
  writeJSONVarint,
  writeKVBlockHeader,
} from './json';

// tslint:disable-next-line:no-namespace
export namespace ping {
  export enum ID {
    ID = P2P_COMMAND_ID_BASE + 3,
  }

  export const PING_OK_RESPONSE_STATUS_TEXT = 'OK';

  // tslint:disable-next-line:no-empty-interface
  export interface IRequest {}
  export interface IResponse {
    status: string;
    peerId: IPeerIDType;
  }

  // export class Reader {
  //   public static request(reader: BufferStreamReader): IRequest {
  //     return {
  //     };
  //   }

  //   public static response(reader: BufferStreamReader): IResponse {
  //     const status = readIPeerNodeData(reader);
  //     const payload = readICoreSyncData(reader);
  //     const localPeerList = [];
  //     const loop = reader.getRemainedSize() / 24;
  //     assert(reader.getRemainedSize() % 24 === 0);
  //     for (let i = 0; i < loop; i++) {
  //       localPeerList.push(readIPeerEntry(reader));
  //     }
  //     return {
  //       node,
  //       payload,
  //       // tslint:disable-next-line:object-literal-sort-keys
  //       localPeerList
  //     };
  //   }
  // }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
    }

    public static response(writer: BufferStreamWriter, data: IResponse) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONObjectKeyValue(
        writer,
        'status',
        data.status,
        BIN_KV_SERIALIZE_TYPE_STRING
      );
      writeJSONObjectKeyValue(
        writer,
        'peer_id',
        data.peerId,
        BIN_KV_SERIALIZE_TYPE_UINT64
      );
    }
  }
}
