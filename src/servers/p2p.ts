import { server } from '../p2p/init';

server.start().then(() => {
  console.log('p2p server started');
});
