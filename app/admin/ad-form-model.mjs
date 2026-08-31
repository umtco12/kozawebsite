const istanbulFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function istanbulInputValue(value) {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(istanbulFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function istanbulInputTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : NaN;
  const input = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return NaN;
  return Date.parse(`${input}:00+03:00`);
}

export function formSignature(value) {
  return JSON.stringify(value ?? {});
}

export function toggleConfirmation({ currentId, dirty, itemId, active, label }) {
  const discardsDraft = Boolean(dirty && currentId && currentId === itemId);
  if (!active && !discardsDraft) return "";
  const prefix = discardsDraft ? "Bu reklamda kaydedilmemiş değişiklikler var ve bu işlemde silinecek. " : "";
  return `${prefix}“${String(label || "Reklam")}” reklamını ${active ? "durdurmak" : "başlatmak"} istiyor musunuz?`;
}
