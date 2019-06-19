import { ICoreSyncData, IPeerEntry, IPeerNodeData } from '../../cryptonote/p2p';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { P2P_COMMAND_ID_BASE } from './defines';
import { BIN_KV_SERIALIZE_TYPE_OBJECT, writeJSONObjectKeyValue } from './json';
import {
  readJSON,
  writeJSONICoreSyncData,
  writeJSONIPeerEntryList,
  writeJSONIPeerNodeData,
  writeJSONVarint,
  writeKVBlockHeader,
} from './json';

// tslint:disable-next-line:no-namespace
export namespace handshake {
  export enum ID {
    ID = P2P_COMMAND_ID_BASE + 1,
  }
  export interface IRequest {
    node: IPeerNodeData;
    payload: ICoreSyncData;
  }
  export interface IResponse {
    node: IPeerNodeData;
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
      const node: IPeerNodeData = {
        networkId: json.node_data.network_id,
        version: json.node_data.version,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(json.node_data.local_time.readUInt32LE(0)),
        peerId: json.node_data.peer_id.readDoubleLE(0),
        myPort: json.node_data.my_port,
      };
      return {
        node,
        payload,
      };
    }
    // public static response(reader: BufferStreamReader): IResponse {
    //   const json = readJSON(reader);
    // }
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONIPeerNodeData(writer, 'node_data', data.node);
      writeJSONICoreSyncData(writer, 'payload_data', data.payload);
    }

    public static response(writer: BufferStreamWriter, data: IResponse) {
      writeKVBlockHeader(writer);
      writeJSONVarint(writer, Object.keys(data).length);
      writeJSONIPeerNodeData(writer, 'node_data', data.node);
      writeJSONICoreSyncData(writer, 'payload_data', data.payload);
      writeJSONIPeerEntryList(writer, 'local_peerlist', data.localPeerList);
    }
  }
}
