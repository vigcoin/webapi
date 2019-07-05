import * as assert from 'assert';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import { IPeerNodeData } from '../cryptonote/p2p';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../cryptonote/serialize/writer';
import { int32, uint32, uint64, UINT64 } from '../cryptonote/types';
import { IP } from '../util/ip';
import { ConnectionState, P2pConnectionContext } from './connection';
import { handshake, ping, timedsync } from './protocol';
import { Handler } from './protocol/handler';

export enum LevinError {
  SUCCESS = 1,
  OK = 0,
  ERROR_CONNECT = -1,
  NOT_FOUND = -2,
  DESTROYED = -3,
  TIMEDOUT = -4,
  NO_DUPLEX_PROTOCOL = -5,
  HANDLER_NOT_DEFINED = -6,
  ERROR_FORMAT = -7,
}

export interface ILevinCommand {
  command: number; // uint32
  isNotify: boolean;
  isResponse: boolean;
  buffer: Buffer;
}

export interface ILevinHeader {
  signature: UINT64;
  size: uint64;
  reply: boolean;
  command: uint32;
  code: int32;
  flags: uint32;
  version: uint32;
}

// CONSTANTS
const LEVIN_SIGNATURE = Buffer.from([
  0x01,
  0x21,
  0x01,
  0x01,
  0x01,
  0x01,
  0x01,
  0x01,
]); // Bender's nightmare
const LEVIN_PACKET_REQUEST = 0x00000001;
const LEVIN_PACKET_RESPONSE = 0x00000002;
const LEVIN_DEFAULT_MAX_PACKET_SIZE = 100000000; // 100MB by default
const LEVIN_PROTOCOL_VER_1 = 1;

export class LevinProtocol extends EventEmitter {
  public static networkId: number[];
  public static readHeader(reader: BufferStreamReader): ILevinHeader {
    const signature = reader.read(8);
    assert(signature.equals(LEVIN_SIGNATURE));
    const sizeBuffer = reader.read(8);
    const size = sizeBuffer.readUInt32LE(0);
    assert(size <= LEVIN_DEFAULT_MAX_PACKET_SIZE);
    const reply = reader.readUInt8() !== 0;
    const command = reader.readUInt32();
    const code = reader.readInt32();
    const flags = reader.readUInt32();
    const version = reader.readUInt32();
    return {
      signature,
      size,
      // tslint:disable-next-line:object-literal-sort-keys
      reply,
      command,
      code,
      flags,
      version,
    };
  }

  public static writeHeader(
    writer: BufferStreamWriter,
    cmd: number,
    buffer: Buffer,
    code: number = 0,
    reply: boolean = false,
    flags: number = LEVIN_PACKET_RESPONSE
  ) {
    writer.write(LEVIN_SIGNATURE);
    writer.writeUInt32(buffer.length);
    writer.writeUInt32(0);
    writer.writeUInt8(reply ? 1 : 0);
    writer.writeUInt32(cmd);
    writer.writeInt32(code);
    writer.writeUInt32(flags);
    writer.writeUInt32(LEVIN_PROTOCOL_VER_1);
    writer.write(buffer);
  }

  public static request(
    cmd: number,
    buffer: Buffer,
    code: number,
    reply: boolean
  ) {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    LevinProtocol.writeHeader(
      writer,
      cmd,
      buffer,
      code,
      reply,
      LEVIN_PACKET_REQUEST
    );
    return writer.getBuffer();
  }

  public static response(
    cmd: number,
    buffer: Buffer,
    code: number,
    reply: boolean = false
  ): Buffer {
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    LevinProtocol.writeHeader(
      writer,
      cmd,
      buffer,
      code,
      reply,
      LEVIN_PACKET_RESPONSE
    );
    return writer.getBuffer();
  }

  public static readCommand(reader: BufferStreamReader): ILevinCommand {
    const header = LevinProtocol.readHeader(reader);
    const buffer = reader.read(header.size);
    return {
      command: header.command,
      isNotify: !header.reply,
      isResponse:
        // tslint:disable-next-line:no-bitwise
        (header.flags & LEVIN_PACKET_RESPONSE) === LEVIN_PACKET_RESPONSE,
      // tslint:disable-next-line:object-literal-sort-keys
      buffer,
    };
  }

  private socket: Socket;
  // private context: P2pConnectionContext;
  constructor(socket: Socket) {
    super();
    this.socket = socket;
    // this.context = context;
  }

  public tryPing(data: IPeerNodeData, context: P2pConnectionContext): boolean {
    if (data.myPort === 0) {
      return false;
    }
    if (!IP.isAllowed(context.ip)) {
      return false;
    }

    const request: ping.IRequest = {};
    const writer = new BufferStreamWriter(Buffer.alloc(0));
    ping.Writer.request(writer, request);
    this.invoke(ping.ID.ID, writer.getBuffer());
    return true;
  }

  public invoke(cmd: uint32, buffer: Buffer) {
    const request = LevinProtocol.request(cmd, buffer, 0, true);
    this.socket.write(request);
  }

  public onIncomingData(
    reader: BufferStreamReader,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    switch (context.state) {
      case ConnectionState.SYNC_REQURIED:
        context.state = ConnectionState.SYNCHRONIZING;
        // handler.startSync(context);
        break;
      case ConnectionState.POOL_SYNC_REQUIRED:
        context.state = ConnectionState.NORMAL;
        // handler.requestMissingPoolTransactions(context);
        break;
    }
    const cmd = LevinProtocol.readCommand(reader);
    this.onCommand(cmd, context, handler);
  }

  public onCommand(
    cmd: ILevinCommand,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    switch (cmd.command) {
      case handshake.ID.ID:
        this.onHandshake(cmd, context, handler);
        break;
      case timedsync.ID.ID:
        if (cmd.isResponse) {
          this.onTimedSyncResponse(cmd);
          return;
        }
        this.onTimedSync(cmd, context);
        break;
      case ping.ID.ID:
        this.onPing(cmd, context);
        break;
      default:
        throw new Error('Error Command!');
    }
  }
  public onTimedSyncResponse(cmd: ILevinCommand) {
    const response: timedsync.IResponse = timedsync.Reader.response(
      new BufferStreamReader(cmd.buffer)
    );
    this.emit('timedsync', response);
  }

  public onHandshake(
    cmd: ILevinCommand,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    const reader = new BufferStreamReader(cmd.buffer);
    const request: handshake.IRequest = handshake.Reader.request(reader);
    assert(
      Buffer.from(request.node.networkId).equals(
        Buffer.from(LevinProtocol.networkId)
      )
    );
    assert(context.isIncoming);
    assert(!context.peerId.length);

    assert(context.processPayLoad(handler, request.payload, true));

    context.peerId = request.node.peerId;

    this.emit('handshake', request);
  }

  public onTimedSync(cmd: ILevinCommand, context: P2pConnectionContext) {
    const reader = new BufferStreamReader(cmd.buffer);
    timedsync.Reader.request(reader);

    if (this.isReply(cmd)) {
      const response: timedsync.IResponse = {
        localTime: new Date(),
        payload: {
          currentHeight: Math.floor(Math.random() * 10000),
          hash: this.getRandomBuffer(32),
        },
        // tslint:disable-next-line:object-literal-sort-keys
        localPeerList: [],
      };
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      timedsync.Writer.response(writer, response);
      const data = LevinProtocol.response(cmd.command, writer.getBuffer(), 0);
      this.socket.write(data);
    }
    this.emit('processed', 'timedsync');
  }

  public onPing(cmd: ILevinCommand, context: P2pConnectionContext) {
    const reader = new BufferStreamReader(cmd.buffer);
    if (cmd.isResponse) {
      const response: ping.IResponse = ping.Reader.response(reader);
      assert(String(response.status) === ping.PING_OK_RESPONSE_STATUS_TEXT);
      this.emit('ping', response);
      return;
    } else {
      ping.Reader.request(reader);
    }

    if (this.isReply(cmd)) {
      const response: ping.IResponse = {
        status: ping.PING_OK_RESPONSE_STATUS_TEXT,
        // tslint:disable-next-line:object-literal-sort-keys
        peerId: context.peerId,
      };
      const writer = new BufferStreamWriter(Buffer.alloc(0));
      ping.Writer.response(writer, response);
      const data = LevinProtocol.response(cmd.command, writer.getBuffer(), 1);
      this.socket.write(data);
    }
    this.emit('processed', 'ping');
  }

  private isReply(cmd: ILevinCommand) {
    return !(cmd.isNotify || cmd.isResponse);
  }

  private getRandomBuffer(length: number) {
    const random = [];
    for (let i = 0; i < length; i++) {
      random.push(Math.floor(Math.random() * 256));
    }
    return Buffer.from(random);
  }
}
