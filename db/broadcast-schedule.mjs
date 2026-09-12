import { normalizeSchedule } from "./settings-model.mjs";

const istanbulClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Istanbul", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const emptyFlow = { dayLabel: "", dayOffset: 0, items: [] };

const toMinutes = (clock) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
const toClock = (minutes) => {
  const value = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
};

function istanbulNow(now) {
  const parts = istanbulClock.formatToParts(now);
  const read = (type) => parts.find((part) => part.type === type)?.value ?? "";
  const day = weekdayIndex[read("weekday")];
  const minutes = Number(read("hour")) * 60 + Number(read("minute"));
  return Number.isInteger(day) && Number.isFinite(minutes) ? { day, minutes } : null;
}

function coversDay(scope, day) {
  if (scope === "hafta-ici") return day >= 1 && day <= 5;
  if (scope === "hafta-sonu") return day === 0 || day === 6;
  return true;
}

/* Bir günün akışı: o güne uymayan programlar düşer, aynı saate düşen ikinci kayıt yok sayılır. */
function rowsForDay(rows, day) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!coversDay(row.days, day) || seen.has(row.time)) return false;
    seen.add(row.time);
    return true;
  });
}

/* Panelde tanımlı günlük akışı, İstanbul saatine göre durumlarıyla birlikte döndürür.
   Bugün için program yoksa akışı olan ilk güne geçilir ve o gün adıyla gösterilir. */
export function selectDailySchedule(schedule, now) {
  if (!Number.isFinite(now)) return emptyFlow;
  const rows = normalizeSchedule(schedule);
  if (!rows.length) return emptyFlow;
  const clock = istanbulNow(now);
  if (!clock) return emptyFlow;

  let dayOffset = 0;
  let list = rowsForDay(rows, clock.day);
  while (!list.length && dayOffset < 6) {
    dayOffset += 1;
    list = rowsForDay(rows, (clock.day + dayOffset) % 7);
  }
  if (!list.length) return emptyFlow;

  const items = list.map((row, index) => {
    const start = toMinutes(row.time);
    /* Gün içinde son program, ertesi günün ilk başlangıcına kadar sürer. */
    const nextStart = index + 1 < list.length ? toMinutes(list[index + 1].time) : toMinutes(list[0].time) + 1440;
    const declared = row.end ? toMinutes(row.end) : 0;
    /* Bitiş saati başlangıçtan küçükse program gece yarısını aşıyor demektir.
       Bir sonraki program başladıysa önceki her hâlükârda bitmiştir. */
    const finish = row.end ? Math.min(declared > start ? declared : declared + 1440, nextStart) : nextStart;
    /* Gece yarısını aşan program, saat başa döndükten sonra da aynı kayıtla yayında kalır. */
    const inWindow = clock.minutes >= start && clock.minutes < finish;
    const afterMidnight = finish > 1440 && clock.minutes + 1440 < finish;
    const live = dayOffset === 0 && (inWindow || afterMidnight);
    const elapsed = inWindow ? clock.minutes - start : clock.minutes + 1440 - start;
    return {
      time: row.time,
      end: toClock(finish),
      title: row.title,
      host: row.host,
      image: row.image,
      days: row.days,
      state: dayOffset > 0 ? "upcoming" : live ? "live" : clock.minutes >= finish ? "past" : "upcoming",
      progress: live ? elapsed / (finish - start) : 0,
    };
  });

  const upcoming = items.findIndex((item) => item.state === "upcoming");
  if (upcoming >= 0) items[upcoming].state = "next";

  return {
    dayLabel: dayOffset === 0 ? "BUGÜN" : dayOffset === 1 ? "YARIN" : dayNames[(clock.day + dayOffset) % 7].toLocaleUpperCase("tr-TR"),
    dayOffset,
    items,
  };
}
