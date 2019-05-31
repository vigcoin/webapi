import * as debug from 'debug';
import { server } from '../init/p2p';

const logger = debug('vigcoin:p2p');

server.start().then(() => {
  logger('p2p server started');
});
