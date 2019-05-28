import { BaseBuffer } from '../src/crypto/types';

test('Should have Hash', () => {
  expect(BaseBuffer).toBeTruthy();
});

test('Should have NULL HASH', () => {
  expect(BaseBuffer.getBuffer()).toBeTruthy();
});
