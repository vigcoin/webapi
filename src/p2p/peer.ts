import { createConnection, Socket } from "net";
import { promisify } from "util";

export class Peer {
  private socket: Socket;
  private port: number;
  private host: string;
  private id: number;
  constructor(port: number, host: string) {
    this.port = port;
    this.host = host;
  }
  public async  start() {
    const s = createConnection({ port: this.port, host: this.host }, () => {
      this.connected();
    });
    this.socket = s;
    s.on('data', async (data) => {
      await this.update(data);
    });
    s.on('end', async () => {
      await this.onEnd();
    });
  }

  public async connected() {
    console.log("connected");
  }

  public async update(data) {
    console.log("updating");
    console.log(data);
  }

  public async stop() {
    console.log("stopping");
    this.socket.end();
  }

  public async onEnd() {
    console.log('onEnd');
  }

}