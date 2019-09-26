import { uint32 } from '../types';
export class TransactionOutput {
  public static toAbsolute(offsets: uint32[]): uint32[] {
    if (!offsets.length) {
      return [];
    }
    const absolute = [];
    absolute[0] = offsets[0];

    for (let i = 1; i < offsets.length; i++) {
      absolute[i] = absolute[i - 1] + offsets[i];
    }
    return absolute;
  }

  public static toRelative(offsets: uint32[]): uint32[] {
    if (!offsets.length) {
      return [];
    }
    const relative = [];
    for (let i = 0; i < offsets.length; i++) {
      relative[i] = offsets[i];
    }
    for (let i = offsets.length - 1; i > 0; i--) {
      relative[i] = relative[i] - relative[i - 1];
    }
    return relative;
  }
}
