export type OrdersDashboardStatsOrder = {
  status: string | null;
  total: number | string | null;
  is_archived: boolean | null;
  created_at: string | null;
  paid_at: string | null;
};

export type OrdersDashboardStats = {
  active: number;
  pendingPayment: number;
  inProduction: number;
  readyForPickup: number;
  paidToday: number;
  paidWeek: number;
  paidMonth: number;
};

export type OrdersDashboardStatsOptions = {
  now: Date;
  timeZone: string;
};

const ZERO_STATS: OrdersDashboardStats = {
  active: 0,
  pendingPayment: 0,
  inProduction: 0,
  readyForPickup: 0,
  paidToday: 0,
  paidWeek: 0,
  paidMonth: 0,
};

const ACTIVE_STATUSES = new Set(["pending_payment", "payment_received", "in_production", "ready_for_pickup"]);
const MS_PER_DAY = 86_400_000;

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  ordinal: number;
};

const weekdayByShortName: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

function localDateParts(date: Date, timeZone: string): LocalDateParts | null {
  if (!Number.isFinite(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(byType.year);
  const month = Number(byType.month);
  const day = Number(byType.day);
  const weekday = weekdayByShortName[byType.weekday ?? ""];

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || !weekday) {
    return null;
  }

  return {
    year,
    month,
    day,
    weekday,
    ordinal: Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY),
  };
}

function safeTotal(total: OrdersDashboardStatsOrder["total"]): number {
  if (total === null) return 0;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSameLocalDay(a: LocalDateParts, b: LocalDateParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function calculateOrdersDashboardStats(
  orders: readonly OrdersDashboardStatsOrder[],
  options: OrdersDashboardStatsOptions,
): OrdersDashboardStats {
  const nowParts = localDateParts(options.now, options.timeZone);
  if (!nowParts) return { ...ZERO_STATS };

  const weekStartOrdinal = nowParts.ordinal - (nowParts.weekday - 1);
  const stats = { ...ZERO_STATS };

  for (const order of orders) {
    if (order.is_archived) continue;

    if (ACTIVE_STATUSES.has(order.status ?? "")) stats.active += 1;
    if (order.status === "pending_payment") stats.pendingPayment += 1;
    if (order.status === "in_production") stats.inProduction += 1;
    if (order.status === "ready_for_pickup") stats.readyForPickup += 1;

    if (!order.paid_at) continue;

    const paidParts = localDateParts(new Date(order.paid_at), options.timeZone);
    if (!paidParts) continue;

    const total = safeTotal(order.total);
    if (isSameLocalDay(paidParts, nowParts)) stats.paidToday += total;
    if (paidParts.ordinal >= weekStartOrdinal && paidParts.ordinal <= nowParts.ordinal) stats.paidWeek += total;
    if (paidParts.year === nowParts.year && paidParts.month === nowParts.month) stats.paidMonth += total;
  }

  return stats;
}
