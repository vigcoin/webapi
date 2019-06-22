import { Configuration } from '../src/config/types';
import { Currency } from '../src/cryptonote/currency';
import { emptyFiles, haveFiles } from './cryptonote/data';
import * as assert from 'assert';

describe('test currency', () => {
  let currency: Currency;
  test('Should init Currency', () => {
    const hex =
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101a9a4569f7e10164a32324b2b878ae32d98be0949ce6e0150ba1d7e54d60969e5';
    const config: Configuration.ICurrency = {
      block: {
        genesisCoinbaseTxHex: hex,
        version: {
          major: 1,
          minor: 0,
          patch: 0,
        },
      },
      blockFiles: haveFiles.files,
      hardfork: [],
    };
    currency = new Currency(config);
    assert(currency.genesis.block.header.version.major === 1);
  });

  test('Should init Currency', () => {
    const hex =
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101a9a4569f7e10164a32324b2b878ae32d98be0949ce6e0150ba1d7e54d60969e5';
    const config: Configuration.ICurrency = {
      block: {
        genesisCoinbaseTxHex: hex,
        version: {
          major: 1,
          minor: 0,
          patch: 0,
        },
      },
      blockFiles: emptyFiles.files,
      hardfork: [],
    };
    currency = new Currency(config);
    assert(currency.genesis.block.header.version.major === 1);
  });
});
