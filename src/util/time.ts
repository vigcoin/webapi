export function readBufferDate(buffer: Buffer, offset: number = 0): Date {
  const v = buffer.readUInt32LE(offset + 0);
  return new Date(v * 1000);
}

export function toUnixTimeStamp(date: Date): number {
  return parseInt((new Date().getTime() / 1000).toFixed(0), 10);
}

export function fromUnixTimeStamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function unixNow(): number {
  return toUnixTimeStamp(new Date());
}
