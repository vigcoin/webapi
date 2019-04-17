import { Wallet } from "@vigcoin/neon";

export = {
  urls: [
    "/wallet/create"
  ],
  routers: {
    post: async (_req: any, res: any, scope: any) => {
      const { errors } = scope;
      let wallet = new Wallet("", "");
      let address = wallet.create(0x3d);
      res.errorize(errors.Success, address);
    }
  }
};
