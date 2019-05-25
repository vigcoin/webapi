import { Peer } from "./peer";
import { IConfig } from "./types";
import { Server, Socket, createServer } from "net";

export class P2PServer {
  private config: IConfig;
  private folder: string;
  private filename: string;
  private peerList: Peer[] = [];
  private clientList: Socket[] = [];
  private server: Server;

  constructor(config: IConfig,
    folder: string,
    filename: string) {
    this.config = config;
    this.folder = folder;
    this.filename = filename;
  }

  public async start() {
    await this.startServer();
    await this.connectPeers();
  }

  public async stop() {
    for (const peer of this.peerList) {
      await peer.stop();
    }
    if (this.server) {
      await new Promise((resolve, reject) => {
        this.server.close((e) => {
          if (e) {
            return reject(e);
          }
          resolve();
        });

      });
    }
  }

  public getPeers() {
    return this.peerList;
  }

  protected async startServer() {
    return new Promise((resolve, reject) => {
      const server = createServer((s) => {
        this.onClient(s);
      });
      const { port, host } = this.config;
      server.listen({ port, host }, (e) => {
        if (e) {
          this.server = null;
          return reject(e);
        }
        resolve(server);
      });
      this.server = server;
    });
  }

  protected async connectPeers() {
    const seeds = this.config.seedNode;
    for (const seed of seeds) {
      const peer = new Peer(seed.port, seed.host);
      try {
        await peer.start();
        this.peerList.push(peer);
      } catch (e) {
        console.error(e);
      }
    }
  }

  protected onClient(s: Socket) {
    if (this.clientList.indexOf(s) === -1) {
      this.clientList.push(s);
    }
  }
}