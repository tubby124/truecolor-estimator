/** LOCAL TEST FIXTURE ONLY. No production credentials, users, DB or outbound requests. */
import { createServer } from 'node:http';
const port = Number(process.env.SOCIAL_E2E_AUTH_PORT || 3198);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid fixture port');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.url === '/health') { res.end(JSON.stringify({ fixture: true })); return; }
  if (req.method === 'GET' && req.url === '/auth/v1/user' && req.headers.authorization === 'Bearer fixture.header.signature') {
    res.end(JSON.stringify({ id: 'fixture-owner', email: 'info@true-color.ca', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2020-01-01T00:00:00Z' }));
    return;
  }
  res.statusCode = 401;
  res.end(JSON.stringify({ error: 'Synthetic fixture token required' }));
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Local synthetic social auth fixture ready on 127.0.0.1:${port}\n`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)));
