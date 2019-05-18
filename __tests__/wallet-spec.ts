import { app } from '../src/index';

import * as http from 'supertest';
import * as assert from 'assert';
import * as path from 'path';
import { writeFileSync, unlinkSync } from 'fs';

import { Wallet } from '@vigcoin/neon';

test('Should file a wallet', done => {
  const req = http(app.app);
  req
    .post('/wallet/open')
    .type('form')
    .attach('file', path.resolve(__dirname, './wallets/vig.wallet'))
    .expect(200)
    .end((err, res) => {
      assert(!err);
      assert.deepEqual(res.body, {
        code: 0,
        data: {
          address:
            'BFrj6s15vg47Za5ipA46m8CjV59nsEeeNSSozZzs9WEo759Prf3zXke4caP22RESH5Yj2GJubQ6WPCDBR78MX3myNaHsWME',
          keys: {
            spend:
              '32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08',
            view:
              '95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d',
          },
        },
        message: '成功！',
        name: 'Success',
      });
      done(err);
    });
});

test('Should file a wallet with password', done => {
  const req = http(app.app);
  req
    .post('/wallet/open')
    .type('form')
    .field('password', 'abcd$1234')
    .attach('file', path.resolve(__dirname, './wallets/vig-enc.wallet'))
    .expect(200)
    .end((err, res) => {
      assert(!err);
      assert.deepEqual(res.body, {
        code: 0,
        data: {
          address:
            'BFrj6s15vg47Za5ipA46m8CjV59nsEeeNSSozZzs9WEo759Prf3zXke4caP22RESH5Yj2GJubQ6WPCDBR78MX3myNaHsWME',
          keys: {
            spend:
              '32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08',
            view:
              '95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d',
          },
        },
        message: '成功！',
        name: 'Success',
      });
      done(err);
    });
});

test("Should don't file a wallet", done => {
  const req = http(app.app);
  req
    .post('/wallet/open')
    .type('form')
    .field('password', 'aaaa')
    .attach('file', path.resolve(__dirname, './wallets/vig.wallet'))
    .expect(200)
    .end((err, res) => {
      assert(!err);
      assert.deepEqual(
        res.body.data,
        'internal error in Neon module: Wrong secret key!'
      );
      done(err);
    });
});

test('Should refine a wallet', done => {
  const req = http(app.app);
  req
    .post('/wallet/refine')
    .type('form')
    .attach('file', path.resolve(__dirname, './wallets/vig.wallet'))
    .expect(200)
    .end((err, res) => {
      assert(!err);
      const outFile = path.resolve(__dirname, './wallets/refined.wallet');

      writeFileSync(outFile, res.body);

      const wallet = new Wallet(outFile, '');
      const keys = wallet.getPrivateKeys();
      assert(
        keys.spend ===
        '32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08'
      );
      assert(
        keys.view ===
        '95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d'
      );
      done(err);
    });
});

test('Should refine a wallet', done => {
  const req = http(app.app);
  req
    .post('/wallet/refine')
    .type('form')
    .field('password', 'abcd$1234')
    .attach('file', path.resolve(__dirname, './wallets/vig-enc.wallet'))
    .expect(200)
    .end((err, res) => {
      assert(!err);
      const outFile = path.resolve(__dirname, './wallets/refined-enc.wallet');

      writeFileSync(outFile, res.body);

      const wallet = new Wallet(outFile, 'abcd$1234');
      const keys = wallet.getPrivateKeys();
      assert(
        keys.spend ===
        '32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08'
      );
      assert(
        keys.view ===
        '95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d'
      );
      done(err);
    });
});

test('Should not refine a wallet', done => {
  const req = http(app.app);
  req
    .post('/wallet/refine')
    .type('form')
    .field('password', 'wrongpassword')
    .attach('file', path.resolve(__dirname, './wallets/vig-enc.wallet'))
    .expect(500)
    .end(err => {
      assert(!err);
      done(err);
    });
});


test('Should export a wallet from private keys', done => {
  const req = http(app.app);
  req
    .post('/wallet/export')
    .type('form')
    .field('spend', '32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08')
    .field('view', '95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d')
    .expect(200)
    .end((err, res) => {
      assert(!err);
      assert(!err);
      const outFile = path.resolve(__dirname, './wallets/exported.wallet');

      writeFileSync(outFile, res.body);

      const wallet = new Wallet(outFile, '');
      const keys = wallet.getPrivateKeys();
      assert(
        keys.spend ===
        '32e4e5f72797c2fc0e2dda4e80e61bd0093934a305af08c9d3b942715844aa08'
      );
      assert(
        keys.view ===
        '95a27c683df6a73bfc238d78fc55f414c699735d60fad4e3a999806763cb340d'
      );
      unlinkSync(outFile);
      done(err);
    });
});

test('Should export a wallet from private keys', done => {
  const req = http(app.app);
  req
    .post('/wallet/export')
    .type('form')
    .field('spend', '32e4e5f72797c2fc0e2dde80e61bd0093934a305af08c9d3b942715844aa08')
    .field('view', '95a27c683df6a73bfc238d7855f414c699735d60fad4e3a999806763cb340d')
    .expect(500)
    .end((err) => {
      assert(!err);
      done(err);
    });
});


test('Should create a wallet', done => {
  const req = http(app.app);
  req
    .post('/wallet/create')
    .type('form')
    .expect(200)
    .end((err, res) => {
      assert(!err);
      const { address, spend, view } = res.body.data;
      assert(address[0] === 'B');
      assert(spend.length === 64);
      assert(view.length === 64);
      done(err);
    });
});
