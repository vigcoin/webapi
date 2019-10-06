export function medianValue(v: number[]) {
  if (!v.length) {
    return 0;
  }
  if (v.length === 1) {
    return v[0];
  }

  const median = parseInt((v.length / 2).toFixed(0), 10);
  v.sort();
  if (v.length % 2) {
    return v[median];
  }
  return (v[median - 1] + v[median]) / 2;
}
