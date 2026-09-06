/** Server-only encrypted transport credentials. Legacy env belongs only to True Color. */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { DEFAULT_SOCIAL_BUSINESS_ID, socialBusinessScopingEnabled } from './business';
import { getMetaConfig, type MetaConfig } from './meta';
function key() {
  const value = process.env.SOCIAL_CREDENTIAL_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new Error('Business credentials unavailable');
  return Buffer.from(value, 'hex');
}
export function encryptSocialCredentials(businessId: string, config: MetaConfig) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(`social:${businessId}:meta:v1`));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(config), 'utf8'), cipher.final()]);
  return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'), auth_tag: cipher.getAuthTag().toString('base64') };
}
export function decryptSocialCredentials(businessId: string, row: {ciphertext:string;iv:string;auth_tag:string}): MetaConfig {
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(row.iv, 'base64'));
  decipher.setAAD(Buffer.from(`social:${businessId}:meta:v1`));
  decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'));
  const value = JSON.parse(Buffer.concat([decipher.update(Buffer.from(row.ciphertext, 'base64')), decipher.final()]).toString('utf8')) as MetaConfig;
  if (!value.pageId || !value.igUserId || !value.accessToken || !value.graphVersion) throw new Error('Invalid business credentials');
  return value;
}
export async function getBusinessMetaConfig(db: ReturnType<typeof createServiceClient>, businessId: string): Promise<MetaConfig|null> {
  if (businessId === DEFAULT_SOCIAL_BUSINESS_ID) return getMetaConfig();
  if (!socialBusinessScopingEnabled()) return null;
  const {data,error} = await db.from('social_channel_credentials').select('ciphertext,iv,auth_tag').eq('business_id',businessId).eq('provider','meta').maybeSingle();
  if (error || !data) return null;
  try { return decryptSocialCredentials(businessId,data); } catch { return null; }
}
