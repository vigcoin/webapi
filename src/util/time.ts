export function readBufferDate(buffer: Buffer, offset: number = 0): Date {
  const v = buffer.readUInt32LE(offset + 0);
  return new Date(v * 1000);
}
