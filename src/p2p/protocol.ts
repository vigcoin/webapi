import {
  ICommand,
  ICoreSyncData,
  IPeerEntry,
  IPeerIDType,
  IPeerNodeData,
} from '../cryptonote/p2p';

const P2P_COMMAND_ID_BASE = 1000;

export enum EID {
  HANDSHAKE = P2P_COMMAND_ID_BASE + 1,
  TIMED_SYNC = P2P_COMMAND_ID_BASE + 2,
  PING = P2P_COMMAND_ID_BASE + 3,
  REQUEST_STATE_INFO = P2P_COMMAND_ID_BASE + 4,
  REQUEST_NETWORK_STATE = P2P_COMMAND_ID_BASE + 5,
  REQUEST_PEER_ID = P2P_COMMAND_ID_BASE + 6,
}

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
}

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
    node: IPeerNodeData;
    payload: ICoreSyncData;
    localPeerList: IPeerEntry[];
  }
}

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
    peerId: number;
  }
}

// tslint:disable-next-line:no-namespace
export namespace stateInfo {
  export enum ID {
    ID = P2P_COMMAND_ID_BASE + 4,
  }

  // tslint:disable-next-line:no-empty-interface
  export interface IRequest {}
  export interface IResponse {
    status: string;
    peerId: IPeerIDType;
  }
}

export function initCommand<ID, REQ, RES>(
  id: ID,
  req: REQ,
  res: RES
): ICommand<ID, REQ, RES> {
  return {
    id,
    request: req,
    response: res,
  };
}
