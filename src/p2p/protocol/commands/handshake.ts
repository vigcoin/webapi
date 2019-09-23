import {
  ICoreSyncData,
  IPeerEntry,
  IPeerNodeData,
} from '../../../cryptonote/p2p';
import { BufferStreamReader } from '../../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../../cryptonote/serialize/writer';
import { logger } from '../../../logger';
import { LevinProtocol } from '../../levin';
import { P2P_COMMAND_ID_BASE } from '../defines';
import {
  readJSON,
  readJSONIPeerEntryList,
  writeJSONICoreSyncData,
  writeJSONIPeerEntryList,
  writeJSONIPeerNodeData,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../json';

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

  export class Handler {
    public static getBuffer(node: IPeerNodeData, payload: ICoreSyncData) {
      logger.info('Sending handshaking request ...');
      const request: IRequest = {
        node,
        payload,
      };
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      Writer.request(writer, request);
      return writer.getBuffer();
    }

    public static sendResponse(
      levin: LevinProtocol,
      localPeerList: IPeerEntry[],
      node: IPeerNodeData,
      payload: ICoreSyncData
    ) {
      const response: handshake.IResponse = {
        localPeerList,
        node,
        payload,
      };
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      Writer.response(writer, response);
      levin.writeResponse(ID.ID, writer.getBuffer(), true);
    }
  }

  // tslint:disable-next-line:max-classes-per-file
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
        localTime: new Date(json.node_data.local_time.readUInt32LE(0) * 1000),
        peerId: json.node_data.peer_id,
        myPort: json.node_data.my_port,
      };
      return {
        node,
        payload,
      };
    }
    public static response(reader: BufferStreamReader): IResponse {
      const json = readJSON(reader);
      const payload: ICoreSyncData = {
        currentHeight: json.payload_data.current_height,
        hash: json.payload_data.top_id,
      };
      const node: IPeerNodeData = {
        networkId: json.node_data.network_id,
        version: json.node_data.version,
        // tslint:disable-next-line:object-literal-sort-keys
        localTime: new Date(json.node_data.local_time.readUInt32LE(0) * 1000),
        peerId: json.node_data.peer_id,
        myPort: json.node_data.my_port,
      };
      const localPeerList = readJSONIPeerEntryList(
        new BufferStreamReader(json.local_peerlist)
      );
      return {
        node,
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
