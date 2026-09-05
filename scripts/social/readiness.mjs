/** Read-only readiness receipt. Never calls publish/cron/account-sync endpoints. */
import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('Readiness needs the server Supabase configuration'); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });
const receipt = { checkedAt: new Date().toISOString(), publishingEnabled: process.env.SOCIAL_PUBLISHING_ENABLED === 'true', config: Object.fromEntries(['META_PAGE_ID', 'META_IG_USER_ID', 'META_PAGE_ACCESS_TOKEN', 'OPENROUTER_API_KEY'].map(name => [name, Boolean(process.env[name])])), posts: {}, approvalSchema: false, connectedAccountCount: null, limitations: ['Configuration presence is not provider identity or permission verification', 'No publisher, cron or account-sync endpoint called'] };
let failed = false;
for (const status of ['draft', 'ready', 'posting', 'posted', 'failed', 'skip']) {
  const { count, error } = await db.from('social_posts').select('id', { count: 'exact', head: true }).eq('status', status);
  if (error) { receipt.posts[status] = 'unavailable'; failed = true; } else receipt.posts[status] = count;
}
const schema = await db.from('social_posts').select('approval_hash,approved_at,approved_by,approval_target,approved_rights,approved_media_sha256').limit(0);
receipt.approvalSchema = !schema.error;
const accounts = await db.from('social_accounts').select('id', { count: 'exact', head: true }).eq('is_active', true);
if (!accounts.error) receipt.connectedAccountCount = accounts.count; else failed = true;
console.log(JSON.stringify(receipt, null, 2));
if (failed) process.exitCode = 1;
