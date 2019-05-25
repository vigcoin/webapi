import { Hash, NULL_HASH } from '../src/crypto/types';

test('Should have Hash', () => {
  expect(Hash).toBeTruthy();
});

test('Should have NULL HASH', () => {
  console.log(NULL_HASH);
  expect(NULL_HASH).toBeTruthy();
});
