import * as assert from 'assert';
import { ICoreSyncData, IPeerEntry, IPeerNodeData } from '../../cryptonote/p2p';
import { BufferStreamReader } from '../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../cryptonote/serialize/writer';
import {
  P2P_COMMAND_ID_BASE,
  readICoreSyncData,
  readIPeerEntry,
  readIPeerNodeData,
  writeICoreSyncData,
  writeIPeerEntry,
  writeIPeerNodeData,
} from './defines';

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
      const node = readIPeerNodeData(reader);
      const payload = readICoreSyncData(reader);
      return {
        node,
        payload,
      };
    }

    public static response(reader: BufferStreamReader): IResponse {
      const node = readIPeerNodeData(reader);
      const payload = readICoreSyncData(reader);
      const localPeerList = [];
      const loop = reader.getRemainedSize() / 24;
      assert(reader.getRemainedSize() % 24 === 0);
      for (let i = 0; i < loop; i++) {
        localPeerList.push(readIPeerEntry(reader));
      }
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
      writeIPeerNodeData(writer, data.node);
      writeICoreSyncData(writer, data.payload);
    }

    public static response(writer: BufferStreamWriter, data: IResponse) {
      writeIPeerNodeData(writer, data.node);
      writeICoreSyncData(writer, data.payload);

      for (const peerEntry of data.localPeerList) {
        writeIPeerEntry(writer, peerEntry);
      }
    }
  }
}
