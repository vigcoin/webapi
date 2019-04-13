import { Wallet } from "@vigcoin/neon";
import { unlinkSync } from "fs";
// import { Request, Response } from "express";

export = {
  urls: [
    "/wallet/login"
  ],
  bodies: {
    post: {
      file: true
    }
  },
  sessions: {
    post: {
      session: true
    }
  },
  routers: {
    post: async (req: any, res: any, scope: any) => {
      const { errors } = scope;
      let password = "";
      if (scope.extracted && scope.extracted.body) {
        password = scope.extracted.body.password;
      }

      const files = await req.storage("file");
      const file = files[0].fd;

      try {
        let wallet = new Wallet(file, password);
        let address = wallet.toAddress(0x3d);
        let keys = wallet.getPrivateKeys();
        // unlink(file, () => {
        res.errorize(errors.Success, {
          address,
          keys
        });
        // });
      } catch (e) {
        res.errorize(errors.Failure, e.message);
      }
      unlinkSync(file);

    }
  },
  validations: {
    post: {
      body: {
        spend: {
          type: "string",
          required: true
        },
        view: {
          type: "string",
          required: true
        },
      }
    }
  }
};
