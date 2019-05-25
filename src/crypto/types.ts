export const HASH_LENGTH = 32;

export class Hash {
  private data: Buffer = new Buffer(HASH_LENGTH);
  constructor(data?: Buffer) {
    if (data) {
      this.data = data;
    }
  }

  public get(): Buffer {
    return this.data;
  }
}

export const NULL_HASH = new Hash();