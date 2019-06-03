import { Configuration } from '../src/config/types';
import { Block } from '../src/cryptonote/block';
import { IBlock } from '../src/cryptonote/types';

test('Should init genesis', () => {
  const blockConf: Configuration.IBlock = {
    genesisCoinbaseTxHex:
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101398fb9ec4e76aeef124dfb779de715022efd619e63d7516f8b1470266f5da1fd',
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  };
  const block: IBlock = Block.genesis(blockConf);
  expect(block.header.nonce === 70).toBeTruthy();
});
