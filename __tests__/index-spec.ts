import { VApplication } from '../src/app';
import webapi from '../src/index';
import * as express from 'express';

const app = express();

test('Should have Wallet available', () => {
  expect(VApplication).toBeTruthy();
});

test('Should have export', () => {
  const handler = webapi(app, null);
  expect(handler).toBeTruthy();
});
