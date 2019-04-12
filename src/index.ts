

import { VApplication } from "./app";

const app = VApplication.getInstance();

app.addDir(__dirname, "./wallet");


let port = 8080;
if (process.env.PORT) {
  port = parseInt(process.env.PORT);
}

app.start(port).then(() => {
  app.print("vigcoin:wallet", "Successfully started webapi at: " + port);
}).catch((e) => {
  app.print("vigcoin:wallet", "error start webapi : " + e);
});



