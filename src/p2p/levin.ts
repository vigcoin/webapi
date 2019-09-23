import * as assert from 'assert';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import { cryptonote } from '../config';
import { HANDSHAKE, PROCESSED } from '../config/events';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { BufferStreamWriter } from '../cryptonote/serialize/writer';
import { int32, uint32, uint64, UINT64 } from '../cryptonote/types';
import { logger } from '../logger';
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

export enum LevinState {
  NORMAL = 0,
  INVOKING = 1,
}

export class LevinProtocol extends EventEmitter {
  public static networkId: number[] = cryptonote.NETWORK_ID;
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

  public state: LevinState = LevinState.NORMAL;
  public socket: Socket;
  private chunks: Buffer[] = [];
  constructor(socket: Socket) {
    super();
    this.socket = socket;
  }

  public async initIncoming(
    s: Socket,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    s.on('error', e => {
      logger.info('Connection corrupted!');
      logger.error(e);
    });
    s.on('data', buffer => {
      logger.info('buffer size: ' + buffer.length);
      this.chunks.push(buffer);
      if (!this.isFinished()) {
        return;
      }
      if (this.state === LevinState.NORMAL) {
        logger.info('Receiving new data!');
        const concated = Buffer.concat(this.chunks);
        this.onIncomingData(new BufferStreamReader(concated), context, handler);
        logger.info('Data processed!');
        this.chunks = [];
      }
    });
    s.on('end', () => {
      logger.info(
        'Connection ' + s.remoteAddress + ':' + s.remotePort + ' ended!'
      );
      s.destroy();
    });
  }

  public isFinished() {
    const buffer = Buffer.concat(this.chunks);
    const reader = new BufferStreamReader(buffer);
    try {
      const header = LevinProtocol.readHeader(reader);
      assert(buffer.length <= header.size + 33);
      return buffer.length === header.size + 33;
    } catch (e) {
      logger.info('Error data encountered!');
      this.chunks = [];
      return true;
    }
  }

  public async invoke(t: any, outgoing: Buffer) {
    return new Promise((resovle, reject) => {
      const request = LevinProtocol.request(t.ID.ID, outgoing, 0, true);
      logger.info('Invoking Levin request : ' + t.ID.ID);
      this.state = LevinState.INVOKING;
      const onData = buffer => {
        if (this.state === LevinState.INVOKING) {
          logger.info('Receiving Levin response data!');
          try {
            const reader = new BufferStreamReader(buffer);
            const cmd = LevinProtocol.readCommand(reader);
            if (!cmd.isResponse) {
              reject(new Error('None Response'));
              return;
            }
            const response = t.Reader.response(
              new BufferStreamReader(cmd.buffer)
            );
            logger.info('Successfuly processed Levin invocation!');
            this.state = LevinState.NORMAL;
            this.socket.removeListener('data', onData);
            resovle(response);
          } catch (e) {
            logger.error(
              'Error processing command ' + t.ID.ID + ' invoke response data!'
            );
            this.socket.destroy();
            this.state = LevinState.NORMAL;
            this.socket.removeListener('data', onData);
            reject(e);
          }
        }
      };
      this.socket.on('data', onData);
      this.socket.write(request);
    });
  }

  // connectionHandler
  public onIncomingData(
    reader: BufferStreamReader,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    switch (context.state) {
      case ConnectionState.SYNC_REQURIED:
        logger.info('Start synchronizing!');
        context.state = ConnectionState.SYNCHRONIZING;
        handler.startSync(context);
        break;
      case ConnectionState.POOL_SYNC_REQUIRED:
        logger.info('Into normal state!');
        context.state = ConnectionState.NORMAL;
        // handler.requestMissingPoolTransactions(context);
        break;
    }

    try {
      logger.info('Start reading command...');
      const cmd = LevinProtocol.readCommand(reader);
      logger.info('Command ID: ' + cmd.command);
      logger.info('Is Response: ' + cmd.isResponse);
      logger.info('Is Notify: ' + cmd.isNotify);
      this.onCommand(cmd, context, handler);
    } catch (e) {
      logger.error(e);
      logger.info('Expection occur! Connection shutting down...');
      context.state = ConnectionState.SHUTDOWN;
    }
  }

  public onCommand(
    cmd: ILevinCommand,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    logger.info('On command : ' + cmd.command);
    switch (cmd.command) {
      case handshake.ID.ID:
        logger.info('Inside on hand shaking');
        this.onHandshake(cmd, context, handler);
        break;
      case timedsync.ID.ID:
        timedsync.Handler.process(cmd, context, this);
        break;
      case ping.ID.ID:
        ping.Handler.process(cmd, context, this);
        break;
      default:
        const cryptonoteCmd = handler.onCommand(
          cmd.command,
          cmd.buffer,
          context
        );
        this.emit(PROCESSED, cryptonoteCmd);
    }
  }

  public onHandshake(
    cmd: ILevinCommand,
    context: P2pConnectionContext,
    handler: Handler
  ) {
    logger.info('Inside on hand shake');
    const reader = new BufferStreamReader(cmd.buffer);
    const request: handshake.IRequest = handshake.Reader.request(reader);
    assert(
      Buffer.from(request.node.networkId).equals(
        Buffer.from(LevinProtocol.networkId)
      )
    );

    // assert(context.isIncoming);
    assert(!context.peerId.length);
    assert(handler.processPayLoad(context, request.payload, true));

    context.peerId = request.node.peerId;
    this.emit(HANDSHAKE, request);
    this.emit(PROCESSED, 'handshake');
  }

  public writeResponse(cmd: number, buffer: Buffer, response: boolean) {
    const data = LevinProtocol.response(cmd, buffer, 0, response);
    this.socket.write(data);
  }

  public isReply(cmd: ILevinCommand) {
    return !(cmd.isNotify || cmd.isResponse);
  }
}
