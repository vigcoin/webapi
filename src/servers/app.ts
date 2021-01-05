import * as path from 'path';

// tslint:disable-next-line: no-implicit-dependencies
import * as debug from 'debug';
import * as express from 'express';
// tslint:disable-next-line: no-duplicate-imports
import { Express } from 'express';
import { Server } from 'net';
import { VEvent, VHandler } from 'vig';

export class VApplication {
  public static getInstance(): VApplication {
    if (!VApplication.instance) {
      VApplication.instance = new VApplication(express());
    }
    return VApplication.instance;
  }
  private static instance: VApplication;
  private app: Express;
  private server?: Server;
  private event: VEvent;
  private log: any;
  private config: any;

  private constructor(app: Express, config: any = null) {
    this.app = app;
    this.event = VEvent.getInstance();
    this.log = debug;
    this.config = config;
    this.init();
  }

  public init() {
    this.app.enable('trust proxy 1');
  }

  public async start(port = 8080, ip = 'localhost') {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, ip, (e) => {
        if (e) {
          return reject(e);
        }
        resolve(this.server);
      });
    });
  }

  public print(module: string, message: string) {
    const log = this.log(module);
    log(message);
  }

  public addDir(dirname, relative) {
    const resolved = path.resolve(dirname, relative);
    const handler = new VHandler(undefined, resolved);
    const scope: any = handler.getScope();
    scope.event = this.event;
    handler.attach(this.app);
  }

  public get() {
    return this.app;
  }
}
