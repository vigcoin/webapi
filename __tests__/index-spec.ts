import { VApplication } from '../src/servers/app';
import * as express from 'express';

const webapi = require('../src/index');
const app = express();

test('Should have Wallet available', () => {
  expect(VApplication).toBeTruthy();
});

test('Should have export', () => {
  const handler = webapi(app, null);
  expect(handler).toBeTruthy();
});
