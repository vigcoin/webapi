export function getRandomBytes(length: number = 8) {
  const random = [];
  for (let i = 0; i < length; i++) {
    random.push(Math.floor(Math.random() * 256));
  }
  return Buffer.from(random);
}
