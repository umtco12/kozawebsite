import { normalizeSchedule } from "./settings-model.mjs";

const istanbulClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

// The panel contains a repeating daily schedule. The last programme continues
// until the first start of the next day; tomorrow's starts are labelled explicitly.
export function selectBroadcastWindow(schedule, now) {
  if (!Number.isFinite(now)) return [];
  const rows = [...new Map(normalizeSchedule(schedule).map((row) => [row.time, row])).values()];
  if (!rows.length) return [];
  const [hour, minute] = istanbulClock.format(now).split(":").map(Number);
  const minutes = hour * 60 + minute;
  const starts = rows.map((row) => Number(row.time.slice(0, 2)) * 60 + Number(row.time.slice(3)));
  let current = starts.findLastIndex((start) => start <= minutes);
  if (current < 0) current = rows.length - 1;
  let start = starts[current] > minutes ? starts[current] - 1440 : starts[current];
  return Array.from({ length: Math.min(3, rows.length) }, (_, offset) => {
    const index = (current + offset) % rows.length;
    const duration = (starts[(index + 1) % rows.length] - starts[index] + 1440) % 1440 || 1440;
    const item = { ...rows[index], dayOffset: Math.floor(start / 1440), progress: offset === 0 ? (minutes - start) / duration : 0 };
    start += duration;
    return item;
  });
}
