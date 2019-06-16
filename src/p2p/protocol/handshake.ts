import * as assert from 'assert';
import { ICoreSyncData, IPeerEntry, IPeerNodeData } from '../../cryptonote/p2p';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import { P2P_COMMAND_ID_BASE } from './defines';
import { writeJSONVarint, writeJSONObjectKeyValue } from './json';
import {
  writeJSONICoreSyncData,
  writeJSONIPeerNodeData,
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
    // public static request(reader: BufferStreamReader): IRequest {
    // }
    // public static response(reader: BufferStreamReader): IResponse {
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
    }
  }
}
