import { createHash, timingSafeEqual } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { DEFAULT_SOCIAL_BUSINESS_ID } from '@/lib/social/business';

export class IntakeError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, unknown>) { super(message); }
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Existing default business ID is deliberately not an RFC versioned UUID.
const databaseUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function equalSecret(left: string, right: string) {
  return timingSafeEqual(createHash('sha256').update(left).digest(), createHash('sha256').update(right).digest());
}
export function intakeConfig() {
  const businessId = process.env.SOCIAL_INTAKE_BUSINESS_ID ?? '';
  const operatorId = process.env.SOCIAL_INTAKE_OPERATOR_ID ?? '';
  if (process.env.SOCIAL_INTAKE_ENABLED !== 'true' || process.env.SOCIAL_BUSINESS_SCOPING_ENABLED !== 'true' || !databaseUuid.test(businessId) || !databaseUuid.test(operatorId)) throw new IntakeError(503, 'Photo intake is not activated.');
  // The generation service currently only supports the configured True Color voice.
  if (businessId !== DEFAULT_SOCIAL_BUSINESS_ID) throw new IntakeError(503, 'This business voice is not configured for photo intake.');
  return { businessId, operatorId };
}
export async function requireIntakeAccess(req: Request, approval = false) {
  const config = intakeConfig();
  const draftSecret = process.env.SOCIAL_INTAKE_SECRET ?? '';
  const approvalSecret = process.env.SOCIAL_INTAKE_APPROVAL_SECRET ?? '';
  const secret = approval ? approvalSecret : draftSecret;
  if (secret.length < 32 || (approval && (!draftSecret || equalSecret(approvalSecret, draftSecret)))) throw new IntakeError(503, 'Photo intake credentials are not configured.');
  if (!equalSecret(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) throw new IntakeError(401, 'Unauthorized.');
  await verifyIntakeOperator(config.businessId, config.operatorId);
  return config;
}
export async function verifyIntakeOperator(businessId: string, operatorId: string) {
  const { data, error } = await createServiceClient().from('social_business_members').select('business_id,business:social_businesses!inner(is_active)').eq('business_id', businessId).eq('user_id', operatorId).eq('role', 'operator').eq('business.is_active', true).maybeSingle();
  if (error || !data) throw new IntakeError(403, 'Business access is unavailable.');
}
