import * as assert from 'assert';
import { EventEmitter } from 'events';
import { Socket } from 'net';
import { BufferStreamReader } from '../cryptonote/serialize/reader';
import { ConnectionState } from './connection';
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

export interface IBucketHead {
  signature: number; // uint64
  cb: number; // uint64, size
  haveToReturnData: boolean; // bool
  command: number; // uint32
  returnCode: number; // int32
  flags: number; // uint32
  protocolVersion: number; // uint32
}

// CONSTANTS
const LEVIN_SIGNATURE = Buffer.from('0101010101012101', 'hex'); // Bender's nightmare
const LEVIN_PACKET_REQUEST = 0x00000001;
const LEVIN_PACKET_RESPONSE = 0x00000002;
const LEVIN_DEFAULT_MAX_PACKET_SIZE = 100000000; // 100MB by default
const LEVIN_PROTOCOL_VER_1 = 1;

export class LevinProtocol extends EventEmitter {
  private socket: Socket;

  constructor(socket: Socket) {
    super();
    this.socket = socket;
    this.socket.on('data', buffer => {
      this.onIncomingData(new BufferStreamReader(buffer));
    });
    this.socket.on('end', () => {
      this.socket.destroy();
    });
  }

  public onIncomingData(reader: BufferStreamReader) {
    const signature = reader.read(8);
    assert(signature.equals(LEVIN_SIGNATURE));
    const cb = reader.read(8);
    const size = cb.readUInt32LE(0);
    assert(size <= LEVIN_DEFAULT_MAX_PACKET_SIZE);
    const haveToReturnData = reader.readUInt8() !== 0;
    const command = reader.readUInt32();
    const returnCode = reader.readInt32();
    const flags = reader.readUInt32();
    const protocolVersion = reader.readUInt32();
    const buffer = reader.read(size);
    const cmd: ILevinCommand = {
      command,
      isNotify: !haveToReturnData,
      // tslint:disable-next-line:no-bitwise
      isResponse: (flags & LEVIN_PACKET_RESPONSE) === LEVIN_PACKET_RESPONSE,
      // tslint:disable-next-line:object-literal-sort-keys
      buffer,
    };
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
        this.onTimedSync(cmd);
        break;
    }
  }

  public onTimedSyncResponse(cmd: ILevinCommand): boolean {
    return false;
  }

  public onHandshake(cmd: ILevinCommand) {
    return false;
  }

  public onTimedSync(cmd: ILevinCommand) {
    return false;
  }

  public onPing(cmd: ILevinCommand) {
    return false;
  }
}
