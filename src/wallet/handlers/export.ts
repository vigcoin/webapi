import { Wallet } from '@vigcoin/neon';
import { unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';

export = {
  urls: ['/wallet/export'],
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
        configs: {
          currency: { prefix },
          tempfile: { generated },
        },
      } = scope;
      const { spend, view } = scope.extracted.body;
      try {
        const wallet = new Wallet('', '');
        wallet.setPrivateKeys(spend, view);
        const newFile = resolve(tmpdir(), generated);
        wallet.save(newFile, '');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=vigcoin.wallet'
        );
        res.setHeader('Content-Transfer-Encoding', 'binary');
        res.setHeader('Content-Type', 'application/octet-stream');
        res.sendFile(newFile, () => {
          unlinkSync(newFile);
        });
      } catch (e) {
        // tslint:disable-next-line: no-console
        console.error(e);
        res.status(500).end();
      }
    },
  },
  validations: {
    post: {
      body: {
        spend: {
          type: 'string',
          // tslint:disable-next-line: object-literal-sort-keys
          required: true,
        },
        view: {
          type: 'string',
          // tslint:disable-next-line: object-literal-sort-keys
          required: true,
        },
      },
    },
  },
};
