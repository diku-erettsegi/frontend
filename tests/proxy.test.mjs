import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { request } from 'node:http';

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const docker = async (...args) => (await exec('docker', args, { timeout: 120_000, maxBuffer: 2 * 1024 * 1024 })).stdout.trim();
const mount = (source, target) => ['--mount', `type=bind,source=${resolve(root, source)},target=${target},readonly`];
// node:http deliberately permits an explicit Host header; browser-style fetch
// may replace it with the URL host and would not exercise the production case.
const httpRequest = (url, { method, headers, body }) => new Promise((resolveResponse, reject) => {
  const outgoing = request(url, { method, headers, timeout: 5000 }, incoming => {
    let text = '';
    incoming.setEncoding('utf8');
    incoming.on('data', chunk => { text += chunk; });
    incoming.on('end', () => {
      const responseHeaders = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) if (value != null) responseHeaders.set(name, Array.isArray(value) ? value.join(', ') : value);
      resolveResponse({ status: incoming.statusCode, headers: responseHeaders, json: async () => JSON.parse(text) });
    });
    incoming.on('error', reject);
  });
  outgoing.on('error', reject);
  outgoing.on('timeout', () => outgoing.destroy(new Error('Proxy request timed out')));
  outgoing.end(body);
});

test('Nginx discards spoofed forwarding headers and preserves trusted API/static behavior', { timeout: 240_000 }, async () => {
  const suffix = randomUUID().slice(0, 12);
  const network = `diku-proxy-test-${suffix}`;
  const backend = `${network}-backend`;
  const frontend = `${network}-frontend`;
  try {
    await docker('network', 'create', network);
    await docker('run', '-d', '--name', backend, '--network', network, '--network-alias', 'backend', ...mount('tests/fixtures/proxy-backend.mjs', '/server.mjs'), 'node:24-alpine', 'node', '/server.mjs');
    await docker('run', '-d', '--name', frontend, '--network', network, '-p', '127.0.0.1::80', ...mount('nginx.conf', '/etc/nginx/conf.d/default.conf'), ...mount('dist', '/usr/share/nginx/html'), 'nginx:1.28-alpine');
    await docker('exec', frontend, 'nginx', '-t');
    const binding = JSON.parse(await docker('inspect', frontend))[0].NetworkSettings.Ports['80/tcp'][0];
    const base = `http://127.0.0.1:${binding.HostPort}`;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { if ((await fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* bounded startup retry */ }
      await delay(250);
    }
    assert.ok(ready, 'isolated proxy/backend should become ready');

    const spoofed = {
      Forwarded: 'for=203.0.113.99;proto=http;host=evil.example:9999',
      'X-Forwarded-For': '203.0.113.98, 203.0.113.97',
      'X-Forwarded-Host': 'evil.example',
      'X-Forwarded-Port': '9999',
      'X-Forwarded-Prefix': '/attacker',
      'X-Forwarded-Ssl': 'on',
    };
    const response = await httpRequest(`${base}/api/headers?check=1`, {
      method: 'POST',
      headers: { ...spoofed, Host: 'diku-erettsegi.hu', 'CF-Connecting-IP': '198.51.100.7', 'X-Forwarded-Proto': 'https', 'Content-Type': 'application/json', Cookie: 'JSESSIONID=proxy-test-session', 'X-CSRF-TOKEN': 'proxy-test-csrf' },
      body: '{"test":"proxy"}',
    });
    assert.equal(response.status, 200);
    const upstream = await response.json();
    for (const name of ['forwarded', 'x-forwarded-port', 'x-forwarded-prefix', 'x-forwarded-ssl']) assert.equal(upstream.headers[name], undefined, `${name} must be removed`);
    assert.equal(upstream.headers['x-forwarded-for'], '198.51.100.7');
    assert.equal(upstream.headers['x-forwarded-host'], 'diku-erettsegi.hu');
    assert.equal(upstream.headers['x-forwarded-proto'], 'https');
    assert.equal(upstream.headers.host, 'diku-erettsegi.hu');
    assert.equal(upstream.headers.cookie, 'JSESSIONID=proxy-test-session');
    assert.equal(upstream.headers['x-csrf-token'], 'proxy-test-csrf');
    assert.equal(upstream.method, 'POST'); assert.equal(upstream.url, '/api/headers?check=1'); assert.equal(upstream.body, '{"test":"proxy"}');
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);

    const direct = await (await fetch(`${base}/api/local`, { headers: spoofed })).json();
    assert.ok(direct.headers['x-forwarded-for']);
    assert.ok(!direct.headers['x-forwarded-for'].includes('203.0.113.'));
    assert.equal(direct.headers['x-forwarded-proto'], 'http');
    assert.equal(direct.headers['x-forwarded-prefix'], undefined);

    assert.equal((await fetch(`${base}/`)).status, 200);
    const redirect = await fetch(`${base}/kurzusok/`, { redirect: 'manual' });
    assert.equal(redirect.status, 301); assert.equal(redirect.headers.get('location'), '/kurzusok');
    assert.equal((await fetch(`${base}/nonexistent-proxy-test-page`)).status, 404);
    assert.equal((await fetch(`${base}/admin`)).headers.get('cache-control'), 'no-store');
  } finally {
    await docker('rm', '-f', frontend).catch(() => {});
    await docker('rm', '-f', backend).catch(() => {});
    await docker('network', 'rm', network).catch(() => {});
  }
});
