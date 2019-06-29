export function PurgeZeroByte(value: Buffer): Buffer {
  while (value[value.length - 1] === 0) {
    if (value.length > 1) {
      value = value.slice(0, value.length - 1);
    } else {
      break;
    }
  }
  return value;
}
