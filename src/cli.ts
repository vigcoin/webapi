import { fork } from 'child_process';
import * as path from 'path';
import { P2PServer } from './p2p/server';

const webapiPath = path.resolve(__dirname, 'main');
const webapi = fork(webapiPath);

const p2pPath = path.resolve(__dirname, './servers/p2p');

const p2pServer = fork(p2pPath);
