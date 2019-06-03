import { Configuration } from '../src/config/types';
import { Block } from '../src/cryptonote/block';
import { IBlock } from '../src/cryptonote/types';

test('Should init genesis', () => {
  const blockConf: Configuration.IBlock = {
    genesisCoinbaseTxHex:
      '013c01ff000101029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd0880712101a9a4569f7e10164a32324b2b878ae32d98be0949ce6e0150ba1d7e54d60969e5',
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
  };
  const block: IBlock = Block.genesis(blockConf);
  expect(block.header.nonce === 70).toBeTruthy();
});
