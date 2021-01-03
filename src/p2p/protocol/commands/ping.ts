import { BufferStreamReader, BufferStreamWriter } from '@vigcoin/serializer';
import { IPeerEntry, IPeerIDType, IPeerNodeData } from '@vigcoin/types';
import * as assert from 'assert';
import { PING, PROCESSED } from '../../../config/events';

import { logger } from '../../../logger';
import { IP } from '../../../util/ip';
import { P2pConnectionContext } from '../../connection';
import { ILevinCommand, LevinProtocol } from '../../levin';
import { PeerManager } from '../../peer-manager';
import { P2P_COMMAND_ID_BASE } from '../defines';
import {
  BIN_KV_SERIALIZE_TYPE_STRING,
  BIN_KV_SERIALIZE_TYPE_UINT64,
  readJSON,
  writeJSONObjectKeyValue,
  writeJSONVarint,
  writeKVBlockHeader,
} from '../json';
import { handshake } from './handshake';

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

  export class Handler {
    public static onTry(
      response: IResponse,
      data: handshake.IRequest,
      context: P2pConnectionContext,
      pm: PeerManager
    ) {
      if (
        response.status === ping.PING_OK_RESPONSE_STATUS_TEXT &&
        response.peerId.equals(data.node.peerId)
      ) {
        const pe: IPeerEntry = {
          lastSeen: new Date(),
          peer: {
            ip: context.ip,
            port: data.node.myPort,
          },
          // tslint:disable-next-line:object-literal-sort-keys
          id: data.node.peerId,
        };
        pm.appendWhite(pe);
        logger.info('BACK PING SUCCESS!');
        logger.info(
          IP.toString(context.ip) +
            ':' +
            data.node.myPort +
            ' added to whitelist'
        );
      }
    }

    public static async try(
      data: IPeerNodeData,
      context: P2pConnectionContext,
      levin: LevinProtocol
    ) {
      if (data.myPort === 0) {
        return { success: false };
      }
      if (!IP.isAllowed(context.ip)) {
        return { success: false };
      }

      const request: IRequest = {};
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      Writer.request(writer, request);
      const response = await levin.invoke(ping, writer.getBuffer());
      return { success: true, response };
    }

    public static process(
      cmd: ILevinCommand,
      context: P2pConnectionContext,
      levin: LevinProtocol
    ) {
      const reader = new BufferStreamReader(cmd.buffer);
      if (cmd.isResponse) {
        const response: IResponse = Reader.response(reader);
        assert(String(response.status) === PING_OK_RESPONSE_STATUS_TEXT);
        levin.emit(PING, response);
        return;
      } else {
        Reader.request(reader);
      }

      if (levin.isReply(cmd)) {
        const response: IResponse = {
          status: ping.PING_OK_RESPONSE_STATUS_TEXT,
          // tslint:disable-next-line:object-literal-sort-keys
          peerId: context.peerId,
        };
        const writer = new BufferStreamWriter(Buffer.alloc(0));
        Writer.response(writer, response);
        const data = LevinProtocol.response(cmd.command, writer.getBuffer(), 1);
        levin.socket.write(data);
      }
      levin.emit(PROCESSED, 'ping');
    }
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Reader {
    public static request(reader: BufferStreamReader): IRequest {
      const json = readJSON(reader);
      assert(Object.keys(json).length === 0);
      return {};
    }

    public static response(reader: BufferStreamReader): IResponse {
      const obj = readJSON(reader);
      return {
        status: obj.status,
        // tslint:disable-next-line:object-literal-sort-keys
        peerId: obj.peer_id,
      };
    }
  }

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
