// tslint:disable-next-line: no-namespace
export namespace Configuration {
  export interface IVersion {
    major: number;
    minor: number;
    patch: number;
  }

  export interface IBlock {
    genesisCoinbaseTxHex: string;
    version: IVersion;
  }
}
