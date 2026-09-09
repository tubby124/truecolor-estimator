import { parseMonthPlan, planReginaTime, type MonthPlan, type MonthPlanCreative } from './monthly-plan';

export interface WeeklySlot {
  date: string;
  enabled: boolean;
  theme: string;
  audience: string;
  objective: string;
  offerIntent: 'none' | 'catalogue';
  reviewed: boolean;
  editorialNotes?: string;
  creative?: MonthPlanCreative;
}
export interface WeeklyPlan {
  schemaVersion: 1;
  kind: 'social-weekly-plan';
  businessKey: string;
  timezone: 'America/Regina';
  title: string;
  weekStart: string;
  cadenceNotes?: string;
  slots: WeeklySlot[];
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
export function weekDates(start: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('Choose a real start date.');
  planReginaTime(`${start}T10:00:00-06:00`);
  return Array.from({ length: 7 }, (_, i) => new Date(Date.parse(`${start}T12:00:00Z`) + i * 86400000).toISOString().slice(0, 10));
}
export function newWeeklyPlan(start: string, businessKey: string): WeeklyPlan {
  return { schemaVersion: 1, kind: 'social-weekly-plan', businessKey, timezone: 'America/Regina', title: 'Weekly storyboard', weekStart: start,
    slots: weekDates(start).map(date => ({ date, enabled: false, theme: '', audience: '', objective: '', offerIntent: 'none', reviewed: false })) };
}
/** Local planning only. A completed creative carries the existing month-plan contract unchanged. */
export function parseWeeklyPlan(input: unknown, businessKey: string): WeeklyPlan {
  const v: unknown = typeof input === 'string' ? JSON.parse(input) : input;
  if (!object(v) || v.schemaVersion !== 1 || v.kind !== 'social-weekly-plan' || v.businessKey !== businessKey || v.timezone !== 'America/Regina' || !text(v.title, 160) || !v.title.trim() || typeof v.weekStart !== 'string' || !Array.isArray(v.slots) || v.slots.length !== 7) throw new Error('Choose a version 1 weekly plan for this business, with seven Regina dates.');
  const dates = weekDates(v.weekStart);
  const slots = v.slots.map((s, i): WeeklySlot => {
    if (!object(s) || s.date !== dates[i] || typeof s.enabled !== 'boolean' || typeof s.reviewed !== 'boolean' || !text(s.theme, 160) || !text(s.audience, 300) || !text(s.objective, 500) || typeof s.offerIntent !== 'string' || !['none', 'catalogue'].includes(s.offerIntent)) throw new Error('Each day needs bounded planning text, valid choices and its original date.');
    let creative: MonthPlanCreative | undefined;
    if (s.creative !== undefined) {
      creative = parseMonthPlan({ schemaVersion: 1, kind: 'truecolor-month-plan', title: v.title, creatives: [s.creative] }).creatives[0];
      if (planReginaTime(creative.scheduleTime).slice(0, 10) !== s.date) throw new Error('Creative date must match its Regina planning day.');
    }
    if (s.editorialNotes !== undefined && !text(s.editorialNotes, 4000)) throw new Error('Editorial notes must be text up to 4,000 characters.');
    return { date: s.date as string, enabled: s.enabled, theme: s.theme, audience: s.audience, objective: s.objective, offerIntent: s.offerIntent as WeeklySlot['offerIntent'], reviewed: s.reviewed, ...(s.editorialNotes !== undefined ? { editorialNotes: s.editorialNotes as string } : {}), ...(creative ? { creative } : {}) };
  });
  if (v.cadenceNotes !== undefined && !text(v.cadenceNotes, 1000)) throw new Error('Cadence notes must be text up to 1,000 characters.');
  return { schemaVersion: 1, kind: 'social-weekly-plan', businessKey, timezone: 'America/Regina', title: v.title, weekStart: v.weekStart, ...(v.cadenceNotes !== undefined ? { cadenceNotes: v.cadenceNotes as string } : {}), slots };
}

/** Private editorial desk bridge. Dates become proposed planning days only. */
export function importEditorialDesk(input: unknown, start: string, businessKey: string): WeeklyPlan {
  const v: unknown = typeof input === 'string' ? JSON.parse(input) : input;
  if (businessKey !== 'truecolor' || !object(v) || v.schema !== 'hasan-editorial-weekly-desk' || v.version !== 1 || v.businessId !== businessKey || v.timezone !== 'America/Regina' || v.status !== 'DRAFT_UNSCHEDULED' || v.approved !== false || !Array.isArray(v.destinations) || v.destinations.length || !text(v.cadence, 1000) || !Array.isArray(v.rows) || v.rows.length !== 7) throw new Error('Choose the unscheduled True Color export from the private weekly desk.');
  const plan = newWeeklyPlan(start, businessKey);
  plan.cadenceNotes = v.cadence;
  plan.slots = v.rows.map((row, index) => {
    if (!object(row) || !text(row.theme, 160) || !text(row.headline, 300) || !text(row.lane, 300) || !text(row.slot, 300) || !text(row.notes, 2000) || typeof row.date !== 'string' || (row.date !== '' && row.date !== plan.slots[index].date) || row.approved !== false || row.status !== 'DRAFT_UNSCHEDULED') throw new Error('Desk rows need bounded notes and dates matching this week in order.');
    return { ...plan.slots[index], enabled: true, theme: row.theme, editorialNotes: `Headline: ${row.headline}\nProposed slot: ${row.slot}\nImage approach: ${row.lane}\nNotes: ${row.notes}` };
  });
  return plan;
}
export function slotHolds(slot: WeeklySlot): string[] {
  if (!slot.enabled) return [];
  return [!slot.theme.trim() && 'Add a theme', !slot.audience.trim() && 'Add an audience', !slot.objective.trim() && 'Add an objective', !slot.creative && 'Attach a completed creative', slot.offerIntent === 'catalogue' && !slot.creative?.product && 'Attach a catalogue configuration and fact fingerprint', !slot.reviewed && 'Review the completed creative'].filter(Boolean) as string[];
}
/** Atomic export: never silently omit an enabled held day, or manufacture assets/facts. */
export function compileWeeklyPlan(input: unknown, businessKey: string): MonthPlan {
  const plan = parseWeeklyPlan(input, businessKey);
  const active = plan.slots.filter(s => s.enabled);
  if (!active.length) throw new Error('Choose at least one posting day.');
  for (const slot of active) { const holds = slotHolds(slot); if (holds.length) throw new Error(`${slot.date}: ${holds.join('; ')}.`); }
  return parseMonthPlan({ schemaVersion: 1, kind: 'truecolor-month-plan', title: plan.title, creatives: active.map(s => s.creative) });
}
/** A month package has no business identity; caller must confirm its source before attaching. */
export function attachWeekCreatives(plan: WeeklyPlan, input: unknown): WeeklyPlan {
  const month = parseMonthPlan(input);
  const dates = new Set(plan.slots.map(s => s.date));
  const byDate = new Map<string, MonthPlanCreative>();
  for (const creative of month.creatives) {
    const date = planReginaTime(creative.scheduleTime).slice(0, 10);
    if (!dates.has(date)) throw new Error('Use a creative package containing only this seven-day window.');
    if (byDate.has(date)) throw new Error('Only one creative may occupy each Regina day.');
    byDate.set(date, creative);
  }
  return { ...plan, slots: plan.slots.map(s => byDate.has(s.date) ? { ...s, creative: byDate.get(s.date), reviewed: false } : s) };
}
