import { IHash } from '../../crypto/types';
import { MultiMap } from '../../util/map';

export class TimeStamp {
  private map: MultiMap<Date, IHash> = new MultiMap();

  public add(timestamp: Date, hash: IHash) {
    this.map.set(timestamp, hash);
  }
  public remove(timestamp: Date, hash: IHash) {
    this.map.remove(timestamp, item => {
      return !item.equals(hash);
    });
  }
}
