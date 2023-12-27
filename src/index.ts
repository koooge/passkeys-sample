import http from 'node:http';

import { generateOptions } from './registration';

const server = http.createServer(async (req, res) => {

  // GET /generate-registration-option
  if (req.method === 'GET' && req.url?.startsWith('/generate-registration-option')) {
    const opts = await generateOptions('some-id-1');
    console.log(opts);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(opts));
  // POST /verify-registration
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({message: 'Not Found'}));
  }
});
server.listen(3000);
