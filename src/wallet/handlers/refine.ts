import { Wallet } from '@vigcoin/crypto';
import { unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';

export = {
  urls: ['/wallet/refine'],
  // tslint:disable-next-line:object-literal-sort-keys
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
        configs: {
          tempfile: { refined },
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
        const newFile = resolve(tmpdir(), refined);
        wallet.save(newFile, password);
        res.sendFile(newFile, () => {
          unlinkSync(newFile);
        });
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error(e);
        res.status(500).end();
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
