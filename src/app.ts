
import * as path from 'path';

import * as express from "express";
import { Express } from "express";
import * as debug from "debug";
import { VEvent, VHandler } from 'vig';
import { Server } from 'net';

export class VApplication {
  app: Express;
  server?: Server;
  event: VEvent;
  log: any;
  config: any;
  private static instance: VApplication;

  public static getInstance(): VApplication {
    if (!VApplication.instance) {
      VApplication.instance = new VApplication(express());
    }
    return VApplication.instance;

  }

  private constructor(app: Express, config: any = null) {
    this.app = app;
    this.event = VEvent.getInstance();
    this.log = debug;
    this.config = config;
  }

  init() {
    this.app.enable("trust proxy 1");
  }

  start(port = 8080, ip = "localhost") {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, ip, (e) => {
        if (e) {
          return reject(e);
        }
        resolve(this.server);
      });
    });
  }

  print(module: String, message: String) {
    let log = this.log(module);
    log(message);
  }

  addDir(dirname, relative) {
    const resolved = path.resolve(dirname, relative);
    const handler = new VHandler(undefined, resolved);
    let scope: any = handler.getScope();
    scope.event = this.event;
    handler.attach(this.app);
  }
}