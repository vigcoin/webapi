import { Wallet } from '@vigcoin/neon';
import { unlinkSync } from 'fs';

export = {
  urls: ['/wallet/open'],
  // tslint:disable-next-line: object-literal-sort-keys
  bodies: {
    post: {
      file: true,
    },
  },
  sessions: {
    post: {
      session: true,
    },
  },
  routers: {
    post: async (req: any, res: any, scope: any) => {
      const {
        errors,
        configs: {
          currency: { prefix },
        },
      } = scope;
      let password = '';
      if (scope.extracted && scope.extracted.body) {
        password = scope.extracted.body.password;
      }

      const files = await req.storage('file');
      const file = files[0].fd;

      try {
        const wallet = new Wallet(file, password);
        const address = wallet.toAddress(prefix);
        const keys = wallet.getPrivateKeys();
        res.errorize(errors.Success, {
          address,
          keys,
        });
      } catch (e) {
        res.errorize(errors.Failure, e.message);
      }
      unlinkSync(file);
    },
  },
  validations: {
    post: {
      body: {
        password: {
          type: 'string',
        },
      },
    },
  },
};
