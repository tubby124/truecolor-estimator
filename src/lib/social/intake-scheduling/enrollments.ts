/** Only atomic, exact-version intake approvals may extend the original queue. */
import { createServiceClient } from '@/lib/supabase/server';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export const MAX_ENROLLED = 400;
export async function enrolledApprovals(businessId: string, db = createServiceClient(), receipts?: {since:string;after:string|null}): Promise<Map<string, string>> {
  let query = db.from('social_scheduler_enrollments')
    .select('business_id,post_id,approval_hash,post:social_posts!inner(status,schedule_time)')
    .eq('business_id', businessId);
  if (receipts) {
    query = query.in('post.status', ['posted','posting','failed']).gte('post.schedule_time', receipts.since)
      .lte('post.schedule_time', new Date().toISOString()).order('post_id');
    if (receipts.after) query = query.gt('post_id', receipts.after);
  } else query = query.in('post.status', ['ready','posting','failed']);
  const { data, error } = await query.limit(receipts ? 101 : MAX_ENROLLED + 1);
  if (error || !data || (!receipts && data.length > MAX_ENROLLED)) throw new Error('Enrollment scope unavailable');
  const result = new Map<string, string>();
  for (const row of data) {
    if (row.business_id !== businessId || !uuid.test(row.post_id) || !/^[a-f0-9]{64}$/.test(row.approval_hash) || result.has(row.post_id)) throw new Error('Invalid enrollment');
    result.set(row.post_id, row.approval_hash);
  }
  return result;
}
