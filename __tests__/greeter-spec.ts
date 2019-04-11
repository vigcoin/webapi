import { Wallet } from '../src/wallet';

test('Should create a wallet', () => {
  const wallet = new Wallet();
  expect(wallet).toBeTruthy();
});
