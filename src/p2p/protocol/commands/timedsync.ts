import { ICoreSyncData, IPeer, IPeerEntry } from '@vigcoin/types';
import { BufferStreamReader } from '../../../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../../../cryptonote/serialize/writer';
import { ConnectionState, P2pConnectionContext } from '../../connection';
import { ILevinCommand, LevinProtocol } from '../../levin';
import { PeerManager } from '../../peer-manager';
import { Handler as ProtocolHandler } from '../../protocol/handler';
import { P2P_COMMAND_ID_BASE } from '../defines';

import { PROCESSED, TIMED_SYNC } from '../../../config/events';
import { logger } from '../../../logger';
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

  export class Handler {
    public static getBuffer(payload: ICoreSyncData) {
      const request: IRequest = {
        payload,
      };
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      Writer.request(writer, request);
      return LevinProtocol.request(ID.ID, writer.getBuffer(), 0, false);
    }

    public static onMainTimedSync(
      response: IResponse,
      context: P2pConnectionContext,
      pm: PeerManager,
      handler: ProtocolHandler,
      peer: IPeer
    ) {
      pm.handleRemotePeerList(response.localTime, response.localPeerList);
      if (!context.isIncoming) {
        const pe: IPeerEntry = {
          id: context.peerId,
          lastSeen: new Date(),
          peer,
        };
        pm.appendWhite(pe);
      }
      handler.processPayLoad(context, response.payload, false);
    }

    public static handleTimedSyncResponse(
      cmd: ILevinCommand,
      context: P2pConnectionContext,
      handler: ProtocolHandler,
      levin: LevinProtocol
    ) {
      try {
        const response: IResponse = Reader.response(
          new BufferStreamReader(cmd.buffer)
        );
        context.pm.handleRemotePeerList(
          response.localTime,
          response.localPeerList
        );
        if (!context.isIncoming) {
          const peer: IPeer = {
            ip: context.ip,
            port: context.port,
          };
          const pe: IPeerEntry = {
            id: context.peerId,
            lastSeen: new Date(),
            peer,
          };
          context.pm.appendWhite(pe);
        }
        handler.processPayLoad(context, response.payload, false);
        levin.emit(TIMED_SYNC, response);
        return true;
      } catch (e) {
        return false;
      }
    }
    public static process(
      cmd: ILevinCommand,
      context: P2pConnectionContext,
      handler: ProtocolHandler,
      levin: LevinProtocol
    ) {
      if (cmd.isResponse) {
        if (!Handler.handleTimedSyncResponse(cmd, context, handler, levin)) {
          context.state = ConnectionState.SHUTDOWN;
          return;
        }
        return;
      }
      const reader = new BufferStreamReader(cmd.buffer);
      const request = Reader.request(reader);

      if (handler.processPayLoad(context, request.payload, false)) {
        logger.info(
          'Failed to process_payload_sync_data(), dropping connection'
        );
        context.state = ConnectionState.SHUTDOWN;
        return;
      }

      const response: IResponse = {
        localPeerList: context.pm.getLocalPeerList(),
        localTime: new Date(),
        payload: handler.getPayLoad(),
      };

      const writer = new BufferStreamWriter(Buffer.alloc(0));
      Writer.response(writer, response);
      const data = LevinProtocol.response(cmd.command, writer.getBuffer(), 0);
      levin.socket.write(data);
      levin.emit(PROCESSED, 'timedsync');
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
      return {
        payload,
      };
    }
    public static response(reader: BufferStreamReader): IResponse {
      const json = readJSON(reader);

      const localTime = new Date(json.local_time.readUInt32LE(0) * 1000);
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
      writeJSONDateType(writer, 'local_time', data.localTime);
      writeJSONICoreSyncData(writer, 'payload_data', data.payload);
      writeJSONIPeerEntryList(writer, 'local_peerlist', data.localPeerList);
    }
  }
}
