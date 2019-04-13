import { app } from '../src/index';

import * as http from "supertest";
import * as assert from "assert";
import * as path from "path";


test('Should file a wallet', (done) => {
  var req = http(app.app);
  req.post("/wallet/open")
    .type("form")
    .attach('file', path.resolve(__dirname, './wallets/vig.wallet'))
    .expect(200)
    .end(function (err, res) {
      assert(!err);
      assert.deepEqual(res.body, { "code": 0, "name": "Success", "message": "成功！", "data": { "address": "BFrj6s15vg47Za5ipA46m8CjV59nsEeeNSSozZzs9WEo759Prf3zXke4caP22RESH5Yj2GJubQ6WPCDBR78MX3myNaHsWME" } }
      );
      done(err);
    });
  // const wallet = new Wallet();
  // expect(wallet).toBeTruthy();
});

test('Should file a wallet with password', (done) => {
  var req = http(app.app);
  req.post("/wallet/open")
    .type("form")
    .field("password", "abcd$1234")
    .attach('file', path.resolve(__dirname, './wallets/vig-enc.wallet'))
    .expect(200)
    .end(function (err, res) {
      assert(!err);
      assert.deepEqual(res.body, { "code": 0, "name": "Success", "message": "成功！", "data": { "address": "BFrj6s15vg47Za5ipA46m8CjV59nsEeeNSSozZzs9WEo759Prf3zXke4caP22RESH5Yj2GJubQ6WPCDBR78MX3myNaHsWME" } }
      );
      done(err);
    });
  // const wallet = new Wallet();
  // expect(wallet).toBeTruthy();
});

test('Should don\'t file a wallet', (done) => {
  var req = http(app.app);
  req.post("/wallet/open")
    .type("form")
    .field("password", "aaaa")
    .attach('file', path.resolve(__dirname, './wallets/vig.wallet'))
    .expect(200)
    .end(function (err, res) {
      assert(!err);
      assert.deepEqual(res.body.data, "internal error in Neon module: Wrong secret key!");
      done(err);
    });
  // const wallet = new Wallet();
  // expect(wallet).toBeTruthy();
});
