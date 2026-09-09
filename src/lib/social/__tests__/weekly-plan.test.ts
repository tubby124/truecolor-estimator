import { describe, expect, it } from 'vitest';
import { attachWeekCreatives, importEditorialDesk, compileWeeklyPlan, newWeeklyPlan, parseWeeklyPlan, weekDates } from '../weekly-plan';
const creative = { id: '11111111-1111-4111-8111-111111111111', title: 'Real work', scheduleTime: '2026-10-01T02:00:00.000Z', channels: ['facebook'], captionFacebook: 'A finished print.', captionInstagram: '', imageFilename: 'real.jpg', imageSha256: 'a'.repeat(64) };
const month = (creatives = [creative]) => ({ schemaVersion: 1, kind: 'truecolor-month-plan', title: 'Week', creatives });
function complete() {
  const plan = attachWeekCreatives(newWeeklyPlan('2026-09-30', 'truecolor'), month());
  plan.slots[0] = { ...plan.slots[0], enabled: true, theme: 'Real work', audience: 'Local shops', objective: 'See print details', reviewed: true };
  return plan;
}
describe('weekly storyboard compiler', () => {
  it('preserves Regina dates across months and leap days', () => {
    expect(weekDates('2026-09-30')[1]).toBe('2026-10-01');
    expect(weekDates('2028-02-28').slice(0, 3)).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
    expect(complete().slots[0].creative?.scheduleTime).toBe(creative.scheduleTime);
  });
  it.each(['2026-02-30', '2026-13-01', '', '2026-9-1'])('rejects invalid date %s', value => expect(() => weekDates(value)).toThrow());
  it('does not start with an assumed cadence or fabricated assets', () => {
    const plan = newWeeklyPlan('2026-09-30', 'truecolor');
    expect(plan.slots.every(s => !s.enabled && !s.creative)).toBe(true);
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow(/posting day/);
  });
  it('roundtrips planning metadata and completed records without loss', () => {
    const plan = complete();
    expect(parseWeeklyPlan(JSON.stringify(plan), 'truecolor')).toEqual(plan);
    expect(compileWeeklyPlan(plan, 'truecolor').creatives).toEqual([creative]);
    expect(compileWeeklyPlan(plan, 'truecolor')).not.toHaveProperty('approval');
  });
  it('holds whole export if an enabled day lacks work instead of dropping it', () => {
    const plan = complete(); plan.slots[1].enabled = true;
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow(/2026-10-01/);
    plan.slots[1].enabled = false;
    expect(compileWeeklyPlan(plan, 'truecolor').creatives).toHaveLength(1);
  });
  it('requires planning review and source snapshot for offer intent', () => {
    const plan = complete(); plan.slots[0].reviewed = false;
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow(/Review/);
    plan.slots[0].reviewed = true; plan.slots[0].offerIntent = 'catalogue';
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow(/fingerprint/);
  });
  it('rejects foreign business, reordered days and malformed metadata', () => {
    const plan = complete();
    expect(() => parseWeeklyPlan(plan, 'another-business')).toThrow();
    expect(() => parseWeeklyPlan({ ...plan, slots: [...plan.slots].reverse() }, 'truecolor')).toThrow();
    expect(() => parseWeeklyPlan({ ...plan, slots: plan.slots.map(s => ({ ...s, theme: 'a'.repeat(161) })) }, 'truecolor')).toThrow();
  });
  it.each([['catalogue'], ['none'], {}, null, 1])('rejects non-string offer intent %j', offerIntent => {
    const plan = complete();
    const slots = plan.slots.map(s => ({ ...s, offerIntent }));
    expect(() => compileWeeklyPlan({ ...plan, slots }, 'truecolor')).toThrow();
  });
  it('bridges private True Color desk metadata without inventing audience, assets or approval', () => {
    const desk = { schema: 'hasan-editorial-weekly-desk', version: 1, businessId: 'truecolor', timezone: 'America/Regina', cadence: 'Daily proposal', status: 'DRAFT_UNSCHEDULED', approved: false, destinations: [], rows: Array.from({ length: 7 }, () => ({ theme: 'Product story', headline: 'Print details', lane: 'Real work', slot: 'Proposed day', notes: 'Check source photo', date: '', approved: false, status: 'DRAFT_UNSCHEDULED' })) };
    const plan = importEditorialDesk(desk, '2026-09-30', 'truecolor');
    expect(plan.slots[0].theme).toBe('Product story');
    expect(plan.slots[0].editorialNotes).toContain('Check source photo');
    expect(plan.slots.every(s => !s.creative && !s.reviewed && !s.audience)).toBe(true);
    expect(parseWeeklyPlan(JSON.stringify(plan), 'truecolor')).toEqual(plan);
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow(/audience/);
    for (const businessId of ['csa', 'hasan']) expect(() => importEditorialDesk({ ...desk, businessId }, '2026-09-30', 'truecolor')).toThrow(/True Color/);
  });
  it('replacing creative invalidates review and rejects duplicate or out-of-window days', () => {
    expect(attachWeekCreatives(complete(), month()).slots[0].reviewed).toBe(false);
    const other = { ...creative, id: '22222222-2222-4222-8222-222222222222', imageFilename: 'other.jpg', imageSha256: 'b'.repeat(64) };
    expect(() => attachWeekCreatives(complete(), month([creative, other]))).toThrow(/one creative/);
    expect(() => attachWeekCreatives(complete(), month([{ ...other, scheduleTime: '2026-11-01T16:00:00Z' }]))).toThrow(/window/);
  });
  it('rejects duplicate asset bytes and invalid hashes at final export', () => {
    const plan = complete();
    plan.slots[1] = { ...plan.slots[0], date: '2026-10-01', creative: { ...plan.slots[0].creative!, id: '22222222-2222-4222-8222-222222222222', scheduleTime: '2026-10-01T16:00:00Z', imageFilename: 'other.jpg' } };
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow(/unique image/);
    plan.slots[1].creative!.imageSha256 = 'placeholder';
    expect(() => compileWeeklyPlan(plan, 'truecolor')).toThrow();
  });
});
