import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allowedRequest, createPreviewProxy, loopbackOrigin, validPort, PREVIEW_CSP } from './visual-preview-proxy.mjs';
import { parseDocument, normalizeOrigins, capture, differencePaths, validateRoute } from './visual-semantics.mjs';

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

test('loopback and request policy reject remote hosts, credentials, ambiguous routes and unsafe requests', () => {
  for (const url of ['https://127.0.0.1:4100', 'http://example.com', 'http://127.0.0.1.evil:4100',
    'http://user:pass@127.0.0.1:4100', 'http://127.0.0.1:4100/path', 'http://127.0.0.1:4100/?q=x'])
    assert.throws(() => loopbackOrigin(url));
  assert.equal(loopbackOrigin('http://localhost:4100').hostname, '127.0.0.1');
  assert.equal(loopbackOrigin('http://[::1]:4100').hostname, '[::1]');
  for (const value of [0, 65536, '4100suffix', 1.5]) assert.throws(() => validPort(value));
  assert.equal(allowedRequest('POST', '/api/estimate'), true);
  for (const [method, path] of [['POST', '/api/estimate?q=1'], ['POST', '/'], ['GET', '/api/estimate'],
    ['GET', '/api/checkout'], ['POST', '/api/checkout'], ['DELETE', '/products'], ['GET', '/x/../api/staff'],
    ['GET', '/%61pi/orders'], ['GET', '//evil.com'], ['GET', '/api%2forders'],
    ['GET', '/_next/image-bypass?url=%2Fapi%2Festimate&w=64&q=75'],
    ['GET', '/_next/image/?url=%2Fapi%2Forders&w=64&q=75'],
    ['GET', '/_next/image?url=%2Ftruecolorlogo.webp&url=%2Fapi%2Forders&w=64&q=75'],
    ['GET', '/_next/image?url=https%3A%2F%2Fevil.com%2Fa.png&w=100&q=75']])
    assert.equal(allowedRequest(method, path), false, `${method} ${path}`);
  assert.equal(allowedRequest('GET', '/_next/image?url=%2Fimages%2Fproducts%2Fart.webp&w=640&q=75'), true);
  assert.equal(allowedRequest('GET', '/_next/image?url=%2Ftruecolorlogo.webp&w=640&q=75'), true);
  assert.equal(allowedRequest('GET', '/products?q=business'), true);
});

test('no-JS preview serves identical HTML with scripts disabled and local GET forms allowed', async () => {
  const html = '<html><body><script>window.example=1</script><form action="/products"><input name="q"></form></body></html>';
  const upstream = http.createServer((_request, response) => response.end(html));
  const upstreamPort = await listen(upstream);
  const reservation = http.createServer();
  const previewPort = await listen(reservation);
  await close(reservation);
  const proxy = createPreviewProxy({ upstream: `http://127.0.0.1:${upstreamPort}`, port: previewPort, noJs: true });
  proxy.listen(previewPort, '127.0.0.1'); await once(proxy, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${previewPort}/products?q=signs`);
    assert.equal(await response.text(), html);
    assert.match(response.headers.get('content-security-policy'), /script-src 'none'/);
    assert.match(response.headers.get('content-security-policy'), /form-action 'self'/);
  } finally { await close(proxy); await close(upstream); }
});

test('dev eval is explicit, retains every network restriction and cannot combine with no-JS', async () => {
  assert.doesNotMatch(PREVIEW_CSP, /unsafe-eval/);
  assert.throws(() => createPreviewProxy({ upstream: 'http://127.0.0.1:4100', port: 4200, noJs: true, devEval: true }), /cannot be combined/);
  const upstream = http.createServer((_request, response) => response.end('dev only'));
  const upstreamPort = await listen(upstream);
  const reservation = http.createServer();
  const previewPort = await listen(reservation);
  await close(reservation);
  const proxy = createPreviewProxy({ upstream: `http://127.0.0.1:${upstreamPort}`, port: previewPort, devEval: true });
  proxy.listen(previewPort, '127.0.0.1'); await once(proxy, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${previewPort}`);
    assert.equal(response.headers.get('content-security-policy'), PREVIEW_CSP.replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'"));
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal((await fetch(`http://127.0.0.1:${previewPort}/api/checkout`, { method: 'POST' })).status, 403);
  } finally { await close(proxy); await close(upstream); }
});

test('private proxy enforces headers, strips credentials, serves local scripts and exact estimate only', async () => {
  const seen = [];
  const upstream = http.createServer((request, response) => {
    seen.push({ url: request.url, headers: request.headers });
    if (request.url === '/external') { response.writeHead(302, { location: 'https://example.com/' }); response.end(); return; }
    if (request.url === '/redirect') { response.writeHead(302, { location: '/products' }); response.end(); return; }
    response.writeHead(200, { 'content-type': 'text/html', 'content-security-policy': "script-src https:",
      'set-cookie': 'live=secret', 'report-to': '{"endpoint":"https://example.com"}' });
    response.end('<html><body><script src="/_next/static/chunk.js"></script>Private</body></html>');
  });
  const upstreamPort = await listen(upstream);
  const portReservation = http.createServer();
  const previewPort = await listen(portReservation);
  await close(portReservation);
  const proxy = createPreviewProxy({ upstream: `http://127.0.0.1:${upstreamPort}`, port: previewPort });
  proxy.listen(previewPort, '127.0.0.1');
  await once(proxy, 'listening');
  const origin = `http://127.0.0.1:${previewPort}`;
  try {
    const response = await fetch(origin, { headers: { cookie: 'private=value', authorization: 'Bearer private' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-security-policy'), PREVIEW_CSP);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('report-to'), null);
    assert.equal(seen[0].headers.cookie, undefined);
    assert.equal(seen[0].headers.authorization, undefined);
    assert.match(await response.text(), /chunk\.js/);
    assert.equal((await fetch(`${origin}/_next/static/chunk.js`)).status, 200);
    assert.equal((await fetch(`${origin}/api/estimate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 200);
    const count = seen.length;
    assert.equal((await fetch(`${origin}/api/checkout`, { method: 'POST', body: '{}' })).status, 403);
    assert.equal((await fetch(`${origin}/api/staff/orders`)).status, 403);
    assert.equal((await fetch(origin, { headers: { origin: 'https://example.com' } })).status, 403);
    assert.equal(seen.length, count);
    assert.equal((await fetch(`${origin}/external`, { redirect: 'manual' })).status, 502);
    const redirect = await fetch(`${origin}/redirect`, { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('location'), '/products');
  } finally { await close(proxy); await close(upstream); }
});

test('CLI writes both origins and concrete semantic differences to saved JSON', async () => {
  const makeServer = (heading) => http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(`<html><head><title>Same</title><link rel="canonical" href="http://${request.headers.host}/"></head><body><h1>${heading}</h1><a href="/products">Choose</a></body></html>`);
  });
  const before = makeServer('Before'), after = makeServer('After');
  const beforePort = await listen(before), afterPort = await listen(after);
  const directory = await mkdtemp(join(tmpdir(), 'truecolor-semantic-test-'));
  const output = join(directory, 'report.json');
  try {
    const processResult = spawn(process.execPath, [fileURLToPath(new URL('./visual-semantics.mjs', import.meta.url)),
      '--before', `http://127.0.0.1:${beforePort}`, '--after', `http://127.0.0.1:${afterPort}`,
      '--out', output, '--route', '/'], { stdio: 'ignore' });
    const [exitCode] = await once(processResult, 'close');
    assert.equal(exitCode, 1);
    const report = JSON.parse(await readFile(output, 'utf8'));
    assert.equal(report.summary.errors, 0);
    assert.equal(report.summary.different, 1);
    assert.deepEqual(report.routes[0].differences, ['$.document.h1.0', '$.document.bodyText']);
    assert.deepEqual(report.routes[0].before.document.canonical, ['{ORIGIN}/']);
    assert.deepEqual(report.routes[0].after.document.canonical, ['{ORIGIN}/']);
  } finally { await close(before); await close(after); await rm(directory, { recursive: true, force: true }); }
});

test('HTML parser preserves duplicate semantics, nested text, JSON-LD and excludes framework/style code', () => {
  const document = parseDocument(`<html><head><title>A &amp; B</title><meta name="description" content="One"><meta name="description" content="Two"><link rel="canonical" href="https://example.com/"><meta property="og:title" content="OG"><meta name="twitter:card" content="summary"><meta name="robots" content="noindex"></head><body><h1>Buy <span>Signs</span></h1><h2>Details</h2><a href="/products">Choose</a><a href="/products">Again</a><script>self.__next_f.push([1,"SECRET"])</script><style>SECRET</style><script type="application/ld+json">{"@type":"Product","name":"A"}</script><!--$--><p>Real content</p><!--/$--></body></html>`, 'html');
  assert.deepEqual(document.title, ['A & B']);
  assert.deepEqual(document.h1, ['Buy Signs']);
  assert.deepEqual(document.h2, ['Details']);
  assert.equal(document.meta.filter((meta) => meta.name === 'description').length, 2);
  assert.equal(document.anchors.length, 2);
  assert.deepEqual(document.jsonLd, [{ '@type': 'Product', name: 'A' }]);
  assert.equal(document.openGraph.length, 1);
  assert.equal(document.twitter.length, 1);
  assert.equal(document.robots.length, 1);
  assert.equal(document.bodyText, 'Buy SignsDetailsChooseAgainReal content');
});

test('unresolved streamed content, client fallback, invalid JSON-LD and incomplete HTML fail clearly', () => {
  for (const fragment of ['<!--$?--><p>Loading</p>', '<!--$!--><p>Fallback</p>',
    '<div hidden id="S:0">Resolved</div>', '<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>',
    '<script type="application/ld+json">{bad}</script>', '<script>truncated'])
    assert.throws(() => parseDocument(`<html><body>${fragment}</body></html>`, 'html'), /Semantic parser failed/);
  assert.throws(() => parseDocument('<h1>Incomplete</h1>', 'html'), /Missing HTML\/body/);
  assert.throws(() => parseDocument('<html><body><h1>Truncated', 'html'), /Incomplete HTML\/body/);
  assert.throws(() => parseDocument('<html><body><!--$--><h1>Unfinished</h1></body></html>', 'html'), /Unbalanced React suspense/);
});

test('XML sequence/duplicates and text stay exact; normalization changes only exact supplied origins', () => {
  const xml = parseDocument('<urlset><url><loc>https://example.com/a</loc></url><url><loc>https://example.com/a</loc></url></urlset>', 'xml');
  assert.equal(xml.children.length, 2);
  assert.equal(xml.children[0].children[0].text, 'https://example.com/a');
  assert.equal(normalizeOrigins('https://example.com/a https://example.com.evil/a http://127.0.0.1:4100/a', ['https://example.com']), '{ORIGIN}/a https://example.com.evil/a http://127.0.0.1:4100/a');
  assert.deepEqual(differencePaths({ h1: ['A', 'A'] }, { h1: ['A'] }), ['$.h1.1', '$.h1.length']);
  for (const route of ['/api/orders', '/staff', '/pay/token', '/quote/private', '/checkout?token=secret', '//example.com'])
    assert.throws(() => validateRoute(route));
});

test('HTTP capture reads chunked HTML completely and records redirects without external follow', async () => {
  const server = http.createServer((request, response) => {
    if (request.url === '/redirect') { response.writeHead(308, { location: '/page' }); response.end(); return; }
    if (request.url === '/external') { response.writeHead(302, { location: 'https://example.com/' }); response.end(); return; }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.write('<html><head><title>Chunked</title></head><body><h1>');
    setImmediate(() => response.end('Complete</h1></body></html>'));
  });
  const port = await listen(server);
  const origin = `http://127.0.0.1:${port}`;
  try {
    const page = await capture(origin, '/redirect', [origin]);
    assert.equal(page.status, 200);
    assert.deepEqual(page.document.h1, ['Complete']);
    assert.deepEqual(page.redirects, [{ status: 308, location: '{ORIGIN}/page', followed: true }]);
    const external = await capture(origin, '/external', [origin]);
    assert.equal(external.status, 302);
    assert.equal(external.redirects[0].followed, false);
  } finally { await close(server); }
});
