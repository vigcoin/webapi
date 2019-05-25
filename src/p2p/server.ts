import { Peer } from "./peer";
import { IConfig } from "./types";

export class Server {
  private config: IConfig;
  private folder: string;
  private filename: string;
  private peerList: Peer[] = [];

  constructor(config: IConfig,
    folder: string,
    filename: string) {
    this.config = config;
    this.folder = folder;
    this.filename = filename;
  }

  public async start() {

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

  public async stop() {
    this.peerList.forEach(async (peer) => {
      await peer.stop();
    });
  }

  public getPeers() {
    return this.peerList;
  }
}