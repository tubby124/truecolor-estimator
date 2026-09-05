/** Business schedules are Regina wall time, independent of the browser timezone. */
export const SOCIAL_TIME_ZONE = "America/Regina";

export function reginaDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SOCIAL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function weeklySchedule(start: string, count: number, time: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(time)) return [];
  const cursor = new Date(`${start}T12:00:00Z`);
  if (!Number.isFinite(cursor.getTime()) || cursor.toISOString().slice(0, 10) !== start) return [];
  const [hour, minute] = time.split(":").map(Number);
  if (hour > 23 || minute > 59) return [];
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(cursor);
    day.setUTCDate(day.getUTCDate() + i * 7);
    return `${day.toISOString().slice(0, 10)}T${time}:00`;
  });
}

export function reginaToIso(wallTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:00)?$/.test(wallTime)) throw new Error("Choose a valid Regina date and time");
  const [day, time] = wallTime.split("T");
  if (!weeklySchedule(day, 1, time.slice(0, 5)).length) throw new Error("Choose a valid Regina date and time");
  return new Date(`${wallTime.length === 16 ? wallTime + ":00" : wallTime}-06:00`).toISOString();
}
