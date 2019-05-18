import { Wallet } from '@vigcoin/neon';

export = {
  urls: ['/wallet/create'],
  routers: {
    post: async (_req: any, res: any, scope: any) => {
      const { errors, configs: {
        currency: { prefix }
      } } = scope;
      let wallet = new Wallet('', '');
      let address = wallet.create(prefix);
      res.errorize(errors.Success, address);
    },
  },
};
