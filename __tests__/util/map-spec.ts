import * as assert from 'assert';
import { MultiMap } from '../../src/util/map';

describe('test multimap', () => {
  test('should have multi map', () => {
    const map = new MultiMap<number, number>();
    map.set(1, 1);
    const maped = map.get(1);
    assert(maped[0] === 1);
    map.set(1, 2);
    const maped1 = map.get(1);
    assert(maped1[1] === 2);

    map.clear();
    const maped2 = map.get(1);
    assert(!maped2);
  });

  test('should have multi map', () => {
    const map = new MultiMap<Date, number>();
    const date = new Date();
    map.set(date, 1);
    const maped = map.get(date);
    assert(maped[0] === 1);
    map.set(date, 2);
    const maped1 = map.get(date);
    assert(maped1[1] === 2);

    map.clear();
    const maped2 = map.get(date);
    assert(!maped2);
  });
});
