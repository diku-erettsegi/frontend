import { createServer } from 'node:http';

// Only used on the isolated Docker network created by proxy.test.mjs.
createServer(async (request, response) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ headers: request.headers, method: request.method, url: request.url, body }));
}).listen(8080, '0.0.0.0');
