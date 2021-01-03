import { BufferStreamReader, BufferStreamWriter } from '@vigcoin/serializer';
import {
  ICoreSyncData,
  IPeer,
  IPeerEntry,
  IPeerNodeData,
} from '@vigcoin/types';
import * as assert from 'assert';
import { Socket } from 'net';
import { HANDSHAKE, PROCESSED, TIMED_SYNC } from '../../../config/events';

import { logger } from '../../../logger';
import { P2pConnectionContext } from '../../connection';
import { ConnectionManager } from '../../connection-manager';
import { ILevinCommand, LevinProtocol } from '../../levin';
import { PeerManager } from '../../peer-manager';
import { Handler as ProtocolHandler } from '../../protocol/handler';
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
import { ping } from './ping';
import { timedsync } from './timedsync';

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

    public static async onCmd(
      cm: ConnectionManager,
      pm: PeerManager,
      data: handshake.IRequest,
      context: P2pConnectionContext,
      levin: LevinProtocol
    ) {
      logger.info('on connection manager handshake!');
      if (!data.node.peerId.equals(cm.peerId) && data.node.myPort !== 0) {
        const { success, response: res } = await ping.Handler.try(
          data.node,
          context,
          levin
        );
        if (success) {
          ping.Handler.onTry(res as ping.IResponse, data, context, pm);
        }
      }
      handshake.Handler.sendResponse(
        levin,
        pm.getLocalPeerList(),
        cm.getLocalPeerData(),
        cm.handler.getPayLoad()
      );
    }

    public static async request(
      cm: ConnectionManager,
      peer: IPeer,
      pm: PeerManager,
      s: Socket,
      takePeerListOnly: boolean = false
    ) {
      const buffer = handshake.Handler.getBuffer(
        cm.getLocalPeerData(),
        cm.handler.getPayLoad()
      );
      const { context, levin } = cm.initContext(pm, s, false);
      const response: any = await levin.invoke(handshake, buffer);
      context.version = response.node.version;
      logger.info('Handling peer list');
      pm.handleRemotePeerList(response.node.localTime, response.localPeerList);
      if (takePeerListOnly) {
        logger.info('Handshake take peer list only!');
        return { context, levin };
      }
      logger.info('Processing pay load!');
      cm.handler.processPayLoad(context, response.payload, true);
      logger.info('Pay load processed!');
      context.peerId = response.node.peerId;
      const pe: IPeerEntry = {
        id: context.peerId,
        lastSeen: new Date(),
        peer,
      };
      pm.appendWhite(pe);
      logger.info('COMMAND_HANDSHAKE INVOKED OK');
      levin.on(TIMED_SYNC, (resp: timedsync.IResponse) => {
        timedsync.Handler.onMainTimedSync(resp, context, pm, cm.handler, peer);
      });
      if (context.peerId.equals(cm.peerId)) {
        logger.info('Connection to self detected, dropping connection!');
        s.destroy();
        s = null;
        cm.remove(context);
      }
      return { context, levin };
    }

    public static process(
      cmd: ILevinCommand,
      context: P2pConnectionContext,
      handler: ProtocolHandler,
      levin: LevinProtocol
    ) {
      logger.info('Inside on handshake');
      const reader = new BufferStreamReader(cmd.buffer);
      const request: IRequest = Reader.request(reader);
      assert(
        Buffer.from(request.node.networkId).equals(
          Buffer.from(LevinProtocol.networkId)
        )
      );
      // assert(context.isIncoming);
      assert(!context.peerId.length);
      assert(handler.processPayLoad(context, request.payload, true));

      context.peerId = request.node.peerId;
      levin.emit(HANDSHAKE, request);
      levin.emit(PROCESSED, 'handshake');
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
