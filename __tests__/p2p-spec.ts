import assert = require('assert');
import * as path from 'path';
import { getP2PServer } from '../src/init/p2p';

const dir = path.resolve(__dirname, './vigcoin');
const server = getP2PServer(dir);

describe('test connection', () => {
  beforeEach(() => {
    jest.setTimeout(10000);
  });

  test('Should connect servers', async () => {
    await server.start();
    expect(server).toBeTruthy();
  });

  test('Should stop peers', async () => {
    await server.stop();
  });
});
