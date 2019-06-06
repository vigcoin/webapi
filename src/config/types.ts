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

  export interface IBlockFile {
    data: string;
    index: string;
    cache: string;
    chain: string;
  }

  export interface IHardfork {
    version: number;
    height: number;
    threshold: number;
    time: Date;
  }

  export interface ICurrency {
    block: IBlock;
    blockFiles: IBlockFile;
    hardfork: IHardfork[];
  }
}
