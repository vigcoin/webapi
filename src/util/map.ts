export class MultiMap<KEY, VALUE> {
  private map: Map<KEY, VALUE[]> = new Map();

  public get(k: KEY) {
    return this.map.get(k);
  }
  public set(k: KEY, v: VALUE) {
    let values = this.map.get(k);
    if (!values) {
      values = [v];
    }
    if (values.indexOf(v) === -1) {
      values.push(v);
    }
    this.map.set(k, values);
  }

  public remove(k: KEY, callback: (item: VALUE) => boolean) {
    const items = this.map.get(k);

    const sets = items.filter(callback);

    this.map.set(k, sets);
  }

  public clear() {
    this.map.clear();
  }
}
