import {
  ICoreSyncData,
  IPeerEntry,
  IPeerNodeData,
} from '../../../cryptonote/p2p';
import { BufferStreamReader } from '../../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../../cryptonote/serialize/writer';
import { P2P_COMMAND_ID_BASE } from '../defines';
import {
  readJSON,
  readJSONIPeerEntryList,
  writeJSONDateType,
  writeJSONICoreSyncData,
  writeJSONIPeerEntryList,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../json';

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
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      const payload: ICoreSyncData = {
        currentHeight: json.payload_data.current_height,
        hash: json.payload_data.top_id,
      };
      return {
        payload,
      };
    }
    public static response(reader: BufferStreamReader): IResponse {
      const json = readJSON(reader);

      const localTime = new Date(json.local_time.readUInt32LE(0));
      const payload: ICoreSyncData = {
        currentHeight: json.payload_data.current_height,
        hash: json.payload_data.top_id,
      };
      const localPeerList = readJSONIPeerEntryList(
        new BufferStreamReader(json.local_peerlist)
      );
      return {
        localTime,
        payload,
        // tslint:disable-next-line:object-literal-sort-keys
        localPeerList,
      };
    }
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
      writeJSONDateType(writer, 'local_time', data.localTime.getTime());
      writeJSONICoreSyncData(writer, 'payload_data', data.payload);
      writeJSONIPeerEntryList(writer, 'local_peerlist', data.localPeerList);
    }
  }
}
