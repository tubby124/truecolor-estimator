/** Read-only historical impact scan. Output is aggregate only; no customer data,
 * order identifiers, amounts, notes or credentials are printed or persisted.
 * Required env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.
 */
import { pathToFileURL } from 'node:url';
export function summarizeOrders(rows) {
  const result = { scanned: rows.length, repriceMarkers: 0, nonRushArithmeticMismatch: 0,
    rushArithmeticNotClassified: 0, incompleteAmounts: 0, repriceMissingInvoice: 0,
    markedStatuses: {} };
  for (const row of rows) {
    const marked = /\bREPRICE by\b/.test(row.staff_notes ?? '');
    if (marked) {
      result.repriceMarkers++;
      const status = ['pending_payment','paid','in_production','ready','completed','cancelled'].includes(row.status) ? row.status : 'other';
      result.markedStatuses[status] = (result.markedStatuses[status] ?? 0) + 1;
      if (!row.wave_invoice_id) result.repriceMissingInvoice++;
    }
    const amounts = [row.subtotal, row.gst, row.pst, row.total];
    if (amounts.some((n) => n === null || n === undefined || !Number.isFinite(Number(n)))) {
      result.incompleteAmounts++;
    } else if (row.is_rush) {
      // Legacy rush was stored outside subtotal without an immutable rate.
      // Never apply today's rate to declare historical rush documents correct.
      result.rushArithmeticNotClassified++;
    } else {
      const [subtotal, gst, pst, total] = amounts.map((n) => Math.round(Number(n) * 100));
      if (subtotal + gst + pst !== total) result.nonRushArithmeticMismatch++;
    }
  }
  return result;
}
export async function audit() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('Missing protected Supabase audit credentials');
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  async function rows(table, query) {
    const all = [];
    for (let offset = 0; ; offset += 500) {
      const url = new URL(`/rest/v1/${table}`, base);
      url.search = `${query}&limit=500&offset=${offset}`;
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) throw new Error(`Read-only ${table} scan failed (HTTP ${response.status})`);
      const page = await response.json();
      if (!Array.isArray(page)) throw new Error('Unexpected audit response');
      all.push(...page);
      if (page.length < 500) return all;
    }
  }
  const orders = await rows('orders', 'select=id,subtotal,gst,pst,total,is_rush,status,staff_notes,wave_invoice_id&order=id.asc');
  const events = await rows('audit_events', 'select=id,entity_id&event_type=eq.order.repriced&order=id.asc');
  const markedIds = new Set(orders.filter((row) => /\bREPRICE by\b/.test(row.staff_notes ?? '')).map((row) => row.id));
  console.log(JSON.stringify({ readAt: new Date().toISOString(), readOnly: true,
    orders: summarizeOrders(orders), repriceAuditEvents: events.length,
    eventEntitiesWithoutOrderMarker: new Set(events.filter((event) => !markedIds.has(event.entity_id)).map((event) => event.entity_id)).size,
    limitations: ['Application records only; provider invoice/payment/email delivery not reconciled.',
      'No automatic corrections or customer communications.', 'Live pagination is not a transactionally consistent database snapshot.'] }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  audit().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
