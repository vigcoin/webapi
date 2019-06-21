import * as assert from 'assert';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import { Handler } from '../cryptonote/protocol/handler';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { int32, uint32, uint64, UINT64 } from '../cryptonote/types';
import { ConnectionState, P2pConnectionContext } from './connection';
import { handshake, ping, timedsync } from './protocol';

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
  private context: P2pConnectionContext;
  constructor(socket: Socket, context: P2pConnectionContext) {
    super();
    this.socket = socket;
    this.context = context;
    this.socket.on('data', buffer => {
      this.onIncomingData(new BufferStreamReader(buffer));
    });
    this.socket.on('end', () => {
      this.socket.destroy();
    });
  }

  public onIncomingData(reader: BufferStreamReader) {
    const cmd = LevinProtocol.readCommand(reader);
    this.onCommand(cmd);
  }

  public onCommand(cmd: ILevinCommand) {
    if (cmd.isResponse && cmd.command === timedsync.ID.ID) {
      if (!this.onTimedSyncResponse(cmd)) {
        this.emit('state', ConnectionState.SHUTDOWN);
        return;
      }
    }
    switch (cmd.command) {
      case handshake.ID.ID:
        this.onHandshake(cmd);
        break;
      case timedsync.ID.ID:
        this.onTimedSync(cmd);
        break;
      case ping.ID.ID:
        this.onPing(cmd);
        break;
      default:
        throw new Error('Error Command!');
    }
  }
  public onTimedSyncResponse(cmd: ILevinCommand): boolean {
    return false;
  }

  public onHandshake(cmd: ILevinCommand) {
    this.emit('processed', 'handshake');

    return false;
  }

  public onTimedSync(cmd: ILevinCommand) {
    this.emit('processed', 'timedsync');

    return false;
  }

  public onPing(cmd: ILevinCommand) {
    this.emit('processed', 'ping');
    return false;
  }
}
