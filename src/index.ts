import { createServer, type IncomingMessage } from 'node:http';
import { readFileSync } from 'node:fs';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types';

import { generateRegOptions, verifyRegResponse } from './registration';
import { generateAuthOptions, verifyAuthResponse } from './authentication';

const loggedInUserId = 'some-id-1'; // TODO: implement login
const server = createServer(async (req, res) => {
  try {
    /* backend */
    if (req.method === 'GET' && req.url?.startsWith('/generate-registration-option')) {
      console.log(req);
      const opts = await generateRegOptions(loggedInUserId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(opts));
    } else if (req.method === 'POST' && req.url === '/verify-registration') {
      const body = await parseReqBodyJson<RegistrationResponseJSON>(req);
      const verification = await verifyRegResponse(loggedInUserId, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ verified: verification.verified }));
    } else if (req.method === 'GET' && req.url?.startsWith('/generate-authentication-option')) {
      const opts = await generateAuthOptions(loggedInUserId);
      console.log(opts);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(opts));
    } else if (req.method === 'POST' && req.url === '/verify-authentication') {
      const body = await parseReqBodyJson<AuthenticationResponseJSON>(req);
      const verification = await verifyAuthResponse(loggedInUserId, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ verified: verification.verified }));

      /* frontend */
    } else if (req.method === 'GET' && req.url === '/') {
      const html = readFileSync('./public/index.html')
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html)
    } else if (req.method === 'GET' && req.url === '/registration.html') {
      const html = readFileSync('./public/registration.html')
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html)
    } else if (req.method === 'GET' && req.url === '/authentication.html') {
      const html = readFileSync('./public/authentication.html')
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html)
    } else if (req.method === 'GET' && req.url === '/public/index.umd.min.js') {
      const html = readFileSync('./public/index.umd.min.js')
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(html)
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not Found' }));
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    console.error(e)
    res.end(JSON.stringify({ message: JSON.stringify(e) }));
  }
});
server.listen(3000);


const parseReqBodyJson = async <T>(req: IncomingMessage): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk });
    req.on('end', () => resolve(JSON.parse(data)));
    req.on('error', reject);
  })
}
