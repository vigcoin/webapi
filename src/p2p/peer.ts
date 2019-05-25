import { createConnection, Socket } from "net";
export class Peer {
  private socket: Socket;
  private port: number;
  private host: string;
  private id: number;
  private connected: boolean = false;
  constructor(port: number, host: string) {
    this.port = port;
    this.host = host;
  }
  public async  start() {
    return new Promise(async (resolve, reject) => {
      const s = createConnection({ port: this.port, host: this.host }, (e) => {
        if (e) {
          console.error(e);
          console.log("error connecting" + this.host + ":" + this.port);
          s.destroy();
          reject(e);
        } else {
          this.onConnected();
          resolve();
        }
      });
      this.socket = s;
      s.on('data', async (data) => {
        await this.update(data);
      });
      s.on('end', async () => {
        await this.onEnd();
      });
    });

  }

  public async onConnected() {
    this.connected = true;
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
    this.connected = false;
    console.log('onEnd');
  }

  public isConnected() {
    return this.connected;
  }

}