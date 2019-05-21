import * as path from 'path';
import { VHandler } from 'vig';

export default (app, parent) => {
  const handler = new VHandler([], path.resolve(__dirname, './wallet'));
  if (parent) {
    handler.setParent(parent);
  }
  handler.attach(app);
  return handler;
};
