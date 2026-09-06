import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeOrders } from './audit-order-consistency.mjs';
test('detects mismatched non-rush totals and does not guess historical rush rate', () => {
  const base = { subtotal: 100, gst: 5, pst: 6, total: 111, status: 'pending_payment' };
  const result = summarizeOrders([base, { ...base, total: 120, staff_notes: '[date] REPRICE by staff' },
    { ...base, total: 155.4, is_rush: true }, { ...base, gst: null }]);
  assert.equal(result.nonRushArithmeticMismatch, 1);
  assert.equal(result.repriceMarkers, 1);
  assert.equal(result.rushArithmeticNotClassified, 1);
  assert.equal(result.incompleteAmounts, 1);
  assert.equal(result.repriceMissingInvoice, 1);
  assert.ok(!JSON.stringify(result).includes('staff'));
});
