export * from './handshake';
export * from './ping';
export * from './timedsync';
import { ICommand } from '../../cryptonote/p2p';

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
