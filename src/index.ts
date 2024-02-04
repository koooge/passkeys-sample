import { createServer, type IncomingMessage } from 'node:http';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/types';

import { generateRegOptions, verifyRegResponse } from './registration';
import { generateAuthOptions, verifyAuthResponse } from './authentication';

const loggedInUserId = 'some-id-1'; // TODO: implement login
const server = createServer(async (req, res) => {
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
  }  else if (req.method === 'GET' && req.url?.startsWith('/generate-authentication-option')) {
    const opts = await generateAuthOptions(loggedInUserId);
    console.log(opts);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(opts));
  } else if (req.method === 'POST' && req.url === '/verify-authentication') {
    const body = await parseReqBodyJson<AuthenticationResponseJSON>(req);
    const verification = await verifyAuthResponse(loggedInUserId, body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ verified: verification.verified }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({message: 'Not Found'}));
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
