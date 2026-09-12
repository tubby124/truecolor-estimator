#!/usr/bin/env node
/**
 * Read-only HTTP comparison; never runs page JavaScript or browser automation.
 *   node scripts/visual-semantics.mjs --before http://127.0.0.1:4100 \
 *     --after http://127.0.0.1:4101 --out /tmp/visual-semantics.json
 * Repeat --route /path to replace the explicit default sample. Production may
 * be used as --before; prefer matching credential-free local builds for parity.
 * Compare upstream origins, NOT the preview proxy's intentional noindex header.
 * Requires python3 (stdlib HTMLParser / ElementTree only); no extra packages.
 * Exit 0 = equal; 1 = differences; 2 = capture/parser error. JSON is saved in
 * every completed comparison, including individual route errors. Snapshots
 * preserve array order, duplicates, text and XML values; only the two supplied
 * origins become {ORIGIN}. No asset, computed CSS, hydrated DOM, accessibility,
 * ranking or browser-flow claim follows from equality here.
 * Default user agent is a normal desktop browser. --user-agent Twitterbot can
 * explicitly request non-streamed bot HTML; both origins use the SAME agent,
 * recorded in the output. Unresolved/client-only React boundaries fail closed.
 */
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_ROUTES = [
  '/', '/products', '/products/coroplast-signs', '/products/business-cards',
  '/coroplast-signs-saskatoon', '/business-cards-saskatoon',
  '/image-upscale-saskatoon', '/logo-vectorization-saskatoon',
  '/contact', '/cart', '/checkout', '/sitemap.xml', '/image-sitemap.xml',
  '/feed/products.xml', '/feed/local-inventory.xml', '/robots.txt',
];
const DEFAULT_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

// HTMLParser receives the complete response (including HTTP-streamed chunks).
// React's replacement scripts are deliberately not evaluated. An incomplete
// suspense shell or segment would double-count or omit text, so reject it.
const PARSER = String.raw`
import sys, json, re
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
payload = json.load(sys.stdin)
class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []; self.body = []; self.body_seen = False; self.html_seen = False
        self.body_closed = False; self.html_closed = False; self.suspense_depth = 0
        self.captures = []; self.active = []; self.jsonld = []; self.script = None
        self.meta = []; self.canonicals = []; self.errors = []
    def handle_comment(self, value):
        if value.strip() in ('$?', '$!'):
            raise ValueError('Unresolved or client-rendered React suspense boundary; streamed replacement requires browser reconciliation')
        if value.strip() == '$': self.suspense_depth += 1
        if value.strip() == '/$': self.suspense_depth -= 1
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'html': self.html_seen = True
        if tag == 'body': self.body_seen = True
        if re.match(r'^(?:S|B|P):', attrs.get('id') or ''):
            self.errors.append('React streamed replacement segment requires browser reconciliation')
        if tag == 'template' and ('data-dgst' in attrs or 'data-msg' in attrs):
            self.errors.append('React error or client-rendering template')
        if tag == 'meta': self.meta.append({k: attrs[k] for k in ('name','property','http-equiv','charset','content') if k in attrs})
        if tag == 'link' and 'canonical' in (attrs.get('rel') or '').lower().split():
            self.canonicals.append(attrs.get('href'))
        if tag in ('title','h1','h2','a'):
            capture = {'tag': tag, 'text': '', 'depth': len(self.stack)}
            if tag == 'a':
                capture.update({k: attrs.get(k) for k in ('href','rel','aria-label')})
            self.captures.append(capture); self.active.append(capture)
        if tag == 'script':
            self.script = {'json': (attrs.get('type') or '').lower() == 'application/ld+json', 'text': ''}
        if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):
            self.stack.append(tag)
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1] == tag: self.handle_endtag(tag)
    def handle_endtag(self, tag):
        if tag == 'html': self.html_closed = True
        if tag == 'body': self.body_closed = True
        if tag == 'script' and self.script is not None:
            if self.script['json']:
                try: self.jsonld.append(json.loads(self.script['text']))
                except ValueError as error: self.errors.append('Invalid JSON-LD: ' + str(error))
            self.script = None
        if tag in self.stack:
            index = len(self.stack) - 1 - self.stack[::-1].index(tag)
            self.stack = self.stack[:index]
            self.active = [capture for capture in self.active if capture['depth'] < index]
    def handle_data(self, data):
        if self.script is not None:
            self.script['text'] += data
            return
        if 'style' in self.stack or 'template' in self.stack: return
        for capture in self.active: capture['text'] += data
        if 'body' in self.stack: self.body.append(data)
    def result(self):
        if not self.html_seen or not self.body_seen: self.errors.append('Missing HTML/body document; cannot assert complete page capture')
        if not self.html_closed or not self.body_closed: self.errors.append('Incomplete HTML/body document')
        if self.suspense_depth != 0: self.errors.append('Unbalanced React suspense boundaries')
        if self.script is not None: self.errors.append('Truncated script element')
        if self.errors: raise ValueError('; '.join(dict.fromkeys(self.errors)))
        text = lambda tag: [c['text'] for c in self.captures if c['tag'] == tag]
        named = lambda prefix: [m for m in self.meta if (m.get('name') or m.get('property') or '').lower().startswith(prefix)]
        return dict(title=text('title'), meta=self.meta, canonical=self.canonicals,
            robots=[m for m in self.meta if (m.get('name') or '').lower() in ('robots','googlebot','bingbot')],
            h1=text('h1'), h2=text('h2'),
            anchors=[{k:v for k,v in c.items() if k not in ('tag','depth')} for c in self.captures if c['tag']=='a'],
            jsonLd=self.jsonld, openGraph=named('og:'), twitter=named('twitter:'), bodyText=''.join(self.body))
def xml_node(node):
    return dict(tag=node.tag, attributes=node.attrib, text=node.text, tail=node.tail, children=[xml_node(child) for child in node])
try:
    if payload['kind'] == 'html':
        document = Document(); document.feed(payload['text']); document.close(); result = document.result()
    elif payload['kind'] == 'xml':
        if re.search(r'<!\s*(DOCTYPE|ENTITY)', payload['text'], re.I): raise ValueError('DTD/entity XML is not supported')
        result = xml_node(ET.fromstring(payload['text']))
    else: result = payload['text']
    print(json.dumps(result, ensure_ascii=False))
except Exception as error:
    print(str(error), file=sys.stderr); sys.exit(1)
`;

export function parseDocument(text, kind) {
  const parsed = spawnSync('python3', ['-c', PARSER], {
    input: JSON.stringify({ text, kind }), encoding: 'utf8', maxBuffer: 24 * 1024 * 1024,
    timeout: 10_000, killSignal: 'SIGKILL',
  });
  if (parsed.error || parsed.status !== 0)
    throw new Error(`Semantic parser failed: ${parsed.error?.message || parsed.stderr.trim() || `exit ${parsed.status}`}`);
  return JSON.parse(parsed.stdout);
}

export function normalizeOrigins(text, origins) {
  // Require URL boundary: https://example.com.attacker must not be normalized.
  for (const origin of [...new Set(origins)].sort((a, b) => b.length - a.length)) {
    const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`${escaped}(?=[/?#\\s"'<>]|$)`, 'g'), '{ORIGIN}');
  }
  return text;
}

export function validateOrigin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
      || url.pathname !== '/' || url.search || url.hash)
    throw new Error('Comparison origins require http(s) origin only, without credentials, path, query or fragment');
  return url.origin;
}

export function validateRoute(route) {
  if (!/^\/(?!\/)/.test(route) || /[\\\s#]/.test(route)) throw new Error(`Invalid public route: ${route}`);
  const url = new URL(route, 'https://audit.invalid');
  if (url.pathname.includes('%') || url.pathname !== route.split('?')[0]
      || /^\/(?:api|staff|account|pay|portal)(?:\/|$)/i.test(url.pathname)
      || /^\/quote\//i.test(url.pathname)) throw new Error(`Not an allowed public audit route: ${route}`);
  // Prevent accidentally putting customer/order tokens in reports or requests.
  if (url.search) throw new Error('Public audit routes must not contain query parameters');
  return route;
}

export async function capture(origin, route, origins, userAgent = DEFAULT_AGENT) {
  let url = new URL(route, origin);
  const redirects = [];
  for (let hop = 0; hop <= 5; hop++) {
    const response = await fetch(url, {
      redirect: 'manual', signal: AbortSignal.timeout(30_000),
      headers: { 'user-agent': userAgent, accept: 'text/html,application/xml,text/plain;q=0.9' },
    });
    const location = response.headers.get('location');
    if ([301, 302, 303, 307, 308].includes(response.status) && location) {
      const next = new URL(location, url);
      const followed = next.origin === origin && hop < 5;
      redirects.push({ status: response.status, location: normalizeOrigins(next.href, origins), followed });
      await response.body?.cancel();
      if (!followed) return { redirects, status: response.status, error: 'External redirect or redirect limit; destination not captured' };
      validateRoute(next.pathname + next.search);
      url = next;
      continue;
    }
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    if (Buffer.byteLength(text) > 16 * 1024 * 1024) throw new Error('Response exceeds 16 MiB audit limit');
    const kind = /(?:application|text)\/(?:[^;]+\+)?xml/i.test(contentType) ? 'xml'
      : /text\/html/i.test(contentType) ? 'html' : 'text';
    const record = {
      redirects, status: response.status, finalUrl: normalizeOrigins(url.href, origins),
      contentType, xRobotsTag: response.headers.get('x-robots-tag'), kind,
      ...(!response.ok ? { error: `Unexpected HTTP ${response.status}; public page not successfully captured` } : {}),
    };
    try { record.document = parseDocument(normalizeOrigins(text, origins), kind); }
    catch (error) { record.error = [record.error, error.message].filter(Boolean).join('; '); }
    return record;
  }
  throw new Error('Redirect limit exceeded');
}

export function differencePaths(before, after, path = '$', differences = []) {
  if (Object.is(before, after)) return differences;
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object'
      || Array.isArray(before) !== Array.isArray(after)) { differences.push(path); return differences; }
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) differencePaths(before[key], after[key], `${path}.${key}`, differences);
  if (Array.isArray(before) && before.length !== after.length) differences.push(`${path}.length`);
  return differences;
}

async function main() {
  const options = { routes: [], userAgent: DEFAULT_AGENT };
  const names = { '--before': 'before', '--after': 'after', '--out': 'out', '--user-agent': 'userAgent' };
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index], value = process.argv[index + 1];
    if (!value || (!names[key] && key !== '--route')) throw new Error(`Unknown/missing argument: ${key}`);
    if (key === '--route') options.routes.push(validateRoute(value));
    else options[names[key]] = value;
  }
  if (!options.before || !options.after || !options.out)
    throw new Error('Required: --before ORIGIN --after ORIGIN --out FILE [--route /path] [--user-agent VALUE]');
  const before = validateOrigin(options.before), after = validateOrigin(options.after);
  const routes = options.routes.length ? options.routes : DEFAULT_ROUTES;
  const report = { version: 1, capturedAt: new Date().toISOString(), before, after,
    userAgent: options.userAgent, normalization: 'Only supplied origins; duplicates and sequence retained', routes: [] };
  for (const route of routes) {
    const results = await Promise.allSettled([before, after].map((origin) => capture(origin, route, [before, after], options.userAgent)));
    const record = { route };
    results.forEach((result, index) => { record[index ? 'after' : 'before'] = result.status === 'fulfilled' ? result.value : { error: result.reason.message }; });
    record.differences = differencePaths(record.before, record.after);
    report.routes.push(record);
    console.log(`${route}: ${record.before.error || record.after.error ? 'ERROR' : record.differences.length ? 'DIFFERENT' : 'equal'}`);
  }
  report.summary = { routes: report.routes.length,
    errors: report.routes.filter((route) => route.before.error || route.after.error).length,
    different: report.routes.filter((route) => route.differences.length > 0).length };
  await mkdir(dirname(options.out), { recursive: true });
  await writeFile(options.out, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify(report.summary));
  process.exitCode = report.summary.errors ? 2 : report.summary.different ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((error) => { console.error(error.message); process.exitCode = 2; });
