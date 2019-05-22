import * as path from 'path';
import { VHandler } from 'vig';

export = (app, parent) => {
  const handler = new VHandler(null, path.resolve(__dirname, './wallet'));
  if (parent) {
    handler.setParent(parent);
  }
  handler.attach(app);
  return handler;
};
