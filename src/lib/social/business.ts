/** Server-only social business context. Never trust a business ID from a draft body. */
import { NextResponse } from 'next/server';
import { createServiceClient, requireStaffUser } from '@/lib/supabase/server';

export const DEFAULT_SOCIAL_BUSINESS_ID = '00000000-0000-4000-8000-000000000001';
export const socialBusinessScopingEnabled = () => process.env.SOCIAL_BUSINESS_SCOPING_ENABLED === 'true';
export interface SocialBusinessContext { businessId: string; user: { id: string; email?: string } }
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function requireSocialBusiness(req?: Request): Promise<SocialBusinessContext | NextResponse> {
  const user = await requireStaffUser();
  if (user instanceof NextResponse) return user;
  const businessId = req?.headers.get('X-Social-Business-Id') || DEFAULT_SOCIAL_BUSINESS_ID;
  if (!uuid.test(businessId)) return NextResponse.json({ error: 'Invalid business context' }, { status: 400 });
  // The existing single staff owner retains exactly the legacy True Color scope.
  if (businessId === DEFAULT_SOCIAL_BUSINESS_ID) return { businessId, user };
  if (!socialBusinessScopingEnabled()) return NextResponse.json({ error: 'Business scope unavailable' }, { status: 403 });
  const { data, error } = await createServiceClient().from('social_business_members').select('business_id')
    .eq('business_id', businessId).eq('user_id', user.id).eq('role', 'operator').maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Business access denied' }, { status: 403 });
  return { businessId, user };
}

/** Feature gate keeps existing approved deliveries readable before the approved migration. */
export function scopeSocialQuery<T extends { eq: (column: string, value: string) => T }>(query: T, businessId: string): T {
  if (!socialBusinessScopingEnabled()) {
    if (businessId !== DEFAULT_SOCIAL_BUSINESS_ID) throw new Error('Business scope unavailable');
    return query;
  }
  return query.eq('business_id', businessId);
}
export function socialBusinessFields(businessId: string) {
  if (!socialBusinessScopingEnabled()) {
    if (businessId !== DEFAULT_SOCIAL_BUSINESS_ID) throw new Error('Business scope unavailable');
    return {};
  }
  return { business_id: businessId };
}
export function socialAssetPrefix(businessId: string) {
  return businessId === DEFAULT_SOCIAL_BUSINESS_ID ? 'social' : `businesses/${businessId}/social`;
}
