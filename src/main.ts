import { VApplication } from './servers/app';

const app = VApplication.getInstance();

app.addDir(__dirname, './wallet');

let port = 8080;
if (process.env.PORT) {
  port = parseInt(process.env.PORT, 10);
}

if (!module.parent) {
  app
    .start(port, process.env.IP)
    .then(() => {
      app.print('vigcoin:wallet', 'Successfully started webapi at: ' + port);
    })
    .catch(e => {
      app.print('vigcoin:wallet', 'error start webapi : ' + e);
    });
}

export { app };

export * from "./p2p";
