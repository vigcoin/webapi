import { ICoreSyncData, IPeerEntry } from '../../cryptonote/p2p';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { P2P_COMMAND_ID_BASE } from './defines';
import { writeJSONIPeerEntryList } from './json';
import {
  BIN_KV_SERIALIZE_TYPE_UINT64,
  writeJSONICoreSyncData,
  writeJSONObjectKeyCount,
  writeJSONObjectKeyValue,
  writeJSONVarint,
  writeKVBlockHeader,
} from './json';

// tslint:disable-next-line:no-namespace
export namespace timedsync {
  export enum ID {
    ID = P2P_COMMAND_ID_BASE + 2,
  }
  export interface IRequest {
    payload: ICoreSyncData;
  }
  export interface IResponse {
    localTime: Date; // unit64
    payload: ICoreSyncData;
    localPeerList: IPeerEntry[];
  }

  export class Reader {
    // public static request(reader: BufferStreamReader): IRequest {
    //   const payload = readICoreSyncData(reader);
    //   return {
    //     payload,
    //   };
    // }
    // public static response(reader: BufferStreamReader): IResponse {
    //   const localTime = reader.readDate();
    //   const node = readIPeerNodeData(reader);
    //   const payload = readICoreSyncData(reader);
    //   const localPeerList = [];
    //   const loop = reader.getRemainedSize() / 24;
    //   assert(reader.getRemainedSize() % 24 === 0);
    //   for (let i = 0; i < loop; i++) {
    //     localPeerList.push(readIPeerEntry(reader));
    //   }
    //   return {
    //     localTime,
    //     node,
    //     payload,
    //     // tslint:disable-next-line:object-literal-sort-keys
    //     localPeerList,
    //   };
    // }
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONICoreSyncData(writer, 'payload_data', data.payload);
    }

    public static response(writer: BufferStreamWriter, data: IResponse) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONObjectKeyValue(
        writer,
        'local_time',
        data.localTime,
        BIN_KV_SERIALIZE_TYPE_UINT64
      );
      writeJSONICoreSyncData(writer, 'payload_data', data.payload);
      writeJSONIPeerEntryList(writer, 'local_peerlist', data.localPeerList);
    }
  }
}
