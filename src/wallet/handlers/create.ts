import { Wallet } from '@vigcoin/neon';

export = {
  urls: ['/wallet/create'],
  // tslint:disable-next-line: object-literal-sort-keys
  routers: {
    // tslint:disable-next-line: variable-name
    post: async (_req: any, res: any, scope: any) => {
      const { errors, configs: {
        currency: { prefix }
      } } = scope;
      const wallet = new Wallet('', '');
      const address = wallet.create(prefix);
      res.errorize(errors.Success, address);
    },
  },
};
