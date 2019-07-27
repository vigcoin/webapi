import { Hash } from '../../../crypto/types';
import { BufferStreamReader } from '../../serialize/reader';
import { BufferStreamWriter } from '../../serialize/writer';
import { CN_COMMANDS_POOL_BASE } from '../defines';

// tslint:disable-next-line:no-namespace
export namespace NSRequestTXPool {
  export enum ID {
    ID = CN_COMMANDS_POOL_BASE + 8,
  }
  export interface IRequest {
    txs: Hash[];
  }

  export class Reader {
    public static request(reader: BufferStreamReader) {}
  }

  // tslint:disable-next-line:max-classes-per-file
  export class Writer {
    public static request(writer: BufferStreamWriter, data: IRequest) {}
  }
}
