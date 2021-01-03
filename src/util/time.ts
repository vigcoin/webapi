export function toUnixTimeStamp(date: Date): number {
  return parseInt((new Date().getTime() / 1000).toFixed(0), 10);
}

export function fromUnixTimeStamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function unixNow(): number {
  return toUnixTimeStamp(new Date());
}
