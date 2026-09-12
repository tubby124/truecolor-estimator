#!/usr/bin/env node
/**
 * Private browser preview, never a deployment server.
 * Start an ALREADY credential-free production build on 127.0.0.1, then:
 *   node scripts/visual-preview-proxy.mjs --upstream http://127.0.0.1:4100 --port 4200
 * Append --no-js for the same HTML with all scripts disabled by response CSP.
 * Append --dev-eval ONLY for development-server UI inspection: webpack's local
 * dev bundles require unsafe-eval. Never use that mode as production-build or
 * performance evidence. It opens no additional network destinations and cannot
 * be combined with --no-js. The default production-preview CSP forbids eval.
 * Open only http://127.0.0.1:4200. Do not open the upstream in the browser.
 * The upstream must be built AND started without live secrets/public collector
 * credentials. This proxy cannot prevent server-side egress or remove secrets
 * embedded in a build. It blocks browser collectors, API writes and credentials;
 * checkout submission, auth, uploads, external fonts/frames deliberately fail.
 * External top-level links are not sandboxed: do not follow them during review.
 */
import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const PREVIEW_CSP = [
  "default-src 'none'", "script-src 'self' 'unsafe-inline'", "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "connect-src 'self'", "font-src 'self'", "media-src 'self' blob:",
  "frame-src 'none'", "worker-src 'none'", "object-src 'none'",
  "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
].join('; ');

const PRIVATE_HEADERS = {
  'content-security-policy': PREVIEW_CSP,
  'x-robots-tag': 'noindex, nofollow',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-dns-prefetch-control': 'off',
  'x-content-type-options': 'nosniff',
};
const DROP_RESPONSE = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'set-cookie',
  'content-security-policy-report-only', 'report-to', 'reporting-endpoints',
  'nel', 'link', 'refresh', 'alt-svc', 'access-control-allow-origin',
  'access-control-allow-credentials',
]);

export function validPort(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 65535)
    throw new Error('Port must be an integer from 1 to 65535');
  return Number(value);
}

export function loopbackOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('Upstream must be a plain HTTP loopback origin without credentials, path, query or hash');
  if (url.hostname === 'localhost') url.hostname = '127.0.0.1'; // Never resolve an arbitrary DNS name.
  validPort(url.port || '80');
  return url;
}

export function allowedRequest(method, rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.startsWith('/') || rawPath.startsWith('//')
      || /[\\\x00-\x20\x7f]/.test(rawPath)) return false;
  const url = new URL(rawPath, 'http://127.0.0.1');
  // Reject encoded/ambiguous path routing, including encoded API aliases.
  if (url.pathname.includes('%') || url.pathname !== rawPath.split('?')[0]) return false;
  if (rawPath === '/api/estimate' && method === 'POST') return true;
  if (!['GET', 'HEAD'].includes(method) || /^\/api(?:\/|$)/i.test(url.pathname)) return false;
  // Next dispatches this handler by prefix; block aliases before validation.
  if (url.pathname.startsWith('/_next/image')) {
    if (url.pathname !== '/_next/image' || url.searchParams.getAll('url').length !== 1) return false;
    const imagePath = url.searchParams.get('url');
    // The image optimizer must not become a server-side external-image proxy.
    if (!imagePath || !(imagePath === '/truecolorlogo.webp' || /^\/images\/[A-Za-z0-9_./-]+$/.test(imagePath))
        || imagePath.includes('..')) return false;
  }
  return true;
}

export function createPreviewProxy({ upstream: upstreamValue, port, noJs = false, devEval = false }) {
  const upstream = loopbackOrigin(upstreamValue);
  validPort(port);
  if (noJs && devEval) throw new Error('--no-js and --dev-eval cannot be combined');
  if (Number(upstream.port || '80') === port) throw new Error('Preview and upstream ports must differ');
  const previewOrigin = `http://127.0.0.1:${port}`;
  const scriptPolicy = noJs ? "script-src 'none'" : devEval
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
  const privateHeaders = { ...PRIVATE_HEADERS, 'content-security-policy':
    PREVIEW_CSP.replace("script-src 'self' 'unsafe-inline'", scriptPolicy) };
  const server = http.createServer((request, response) => {
    const deny = (status, message) => {
      response.writeHead(status, { ...privateHeaders, 'content-type': 'text/plain; charset=utf-8' });
      response.end(`${message}\n`);
      request.resume();
    };
    if (request.headers.host !== `127.0.0.1:${port}`) return deny(403, 'Private preview host required');
    if (request.headers.origin && request.headers.origin !== previewOrigin)
      return deny(403, 'Cross-origin requests are blocked');
    if (!allowedRequest(request.method, request.url)) return deny(403, 'Blocked by private preview');
    if (request.method === 'POST' && !/^application\/json(?:;|$)/i.test(request.headers['content-type'] || ''))
      return deny(415, 'Estimate requires application/json');
    // Allowlist headers: no Cookie, Authorization, forwarded client identity or browser secrets.
    const headers = { host: upstream.host, 'accept-encoding': 'identity' };
    for (const name of ['accept', 'accept-language', 'user-agent', 'content-type',
      'rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-url'])
      if (request.headers[name]) headers[name] = request.headers[name];
    const upstreamRequest = http.request(new URL(request.url, upstream), {
      method: request.method, headers, timeout: 30_000,
    }, (upstreamResponse) => {
      const outgoing = Object.fromEntries(Object.entries(upstreamResponse.headers)
        .filter(([name]) => !DROP_RESPONSE.has(name)));
      if (outgoing.location) {
        let redirect;
        try { redirect = new URL(outgoing.location, upstream); }
        catch { upstreamResponse.resume(); return deny(502, 'Invalid upstream redirect blocked'); }
        if (redirect.origin !== upstream.origin) {
          upstreamResponse.resume();
          return deny(502, 'External upstream redirect blocked');
        }
        outgoing.location = `${redirect.pathname}${redirect.search}${redirect.hash}`;
      }
      response.writeHead(upstreamResponse.statusCode, { ...outgoing, ...privateHeaders });
      upstreamResponse.pipe(response);
      upstreamResponse.on('error', () => response.destroy());
    });
    upstreamRequest.on('timeout', () => upstreamRequest.destroy(new Error('Upstream timeout')));
    upstreamRequest.on('error', () => {
      if (!response.headersSent) deny(502, 'Private upstream unavailable');
      else response.destroy();
    });
    let bodyBytes = 0;
    request.on('data', (chunk) => {
      bodyBytes += chunk.length;
      if (bodyBytes > 64 * 1024) {
        upstreamRequest.destroy();
        if (!response.headersSent) deny(413, 'Preview request too large');
      }
    });
    request.on('aborted', () => upstreamRequest.destroy());
    response.on('close', () => upstreamRequest.destroy());
    request.pipe(upstreamRequest);
  });
  server.on('upgrade', (_request, socket) => socket.destroy());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 4 || args.length > 6 || args[0] !== '--upstream' || args[2] !== '--port'
        || args.slice(4).some((flag) => !['--no-js', '--dev-eval'].includes(flag))
        || new Set(args.slice(4)).size !== args.slice(4).length)
      throw new Error('Usage: node scripts/visual-preview-proxy.mjs --upstream http://127.0.0.1:4100 --port 4200 [--no-js | --dev-eval]');
    const port = validPort(args[3]);
    const server = createPreviewProxy({ upstream: args[1], port, noJs: args.includes('--no-js'), devEval: args.includes('--dev-eval') });
    server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Private preview: http://127.0.0.1:${port} (collectors/API mutations blocked; estimate allowed; scripts ${args.includes('--no-js') ? 'disabled' : args.includes('--dev-eval') ? 'local with eval: DEV UI ONLY, not production/performance evidence' : 'local only'})`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
