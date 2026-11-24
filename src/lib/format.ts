// Formatting in AP style: numbers one to nine spelled out, a.m./p.m.,
// full month names, no serial comma. Times shown in Philippine time.

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
export const TZ = "Asia/Manila";

export function spell(n: number, capitalize = false): string {
  const s = n >= 0 && n < 10 && Number.isInteger(n) ? WORDS[n] : n.toLocaleString("en-US");
  return capitalize ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${spell(n)} ${n === 1 ? one : many}`;
}

export function peso(n: number): string {
  return `₱${Math.round(n).toLocaleString("en-US")}`;
}

export function allowanceLabel(n: number): string {
  return n > 0 ? `${peso(n)} a month` : "Unpaid";
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

function parts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return p as Record<string, string>;
}

export function apTime(d: Date): string {
  const p = parts(d);
  const mer = p.dayPeriod?.toLowerCase().startsWith("a") ? "a.m." : "p.m.";
  if (p.hour === "12" && p.minute === "00") return mer === "p.m." ? "noon" : "midnight";
  return p.minute === "00" ? `${p.hour} ${mer}` : `${p.hour}:${p.minute} ${mer}`;
}

export function apDate(d: Date, withYear = false): string {
  const p = parts(d);
  return withYear ? `${p.month} ${p.day}, ${p.year}` : `${p.month} ${p.day}`;
}

export function apWeekday(d: Date): string {
  return parts(d).weekday;
}

function dayIndex(d: Date): number {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return Math.floor(Date.parse(`${p}T00:00:00Z`) / 86400000);
}

// "Two hours ago", "Yesterday", "16 days ago", "March 1"
export function ago(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 2) return "Now";
  if (mins < 60) return `${spell(mins, true)} minutes ago`;
  const hours = Math.round(mins / 60);
  const days = dayIndex(now) - dayIndex(d);
  if (days === 0) return hours === 1 ? "One hour ago" : `${spell(hours, true)} hours ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${spell(days, true)} days ago`;
  return apDate(d);
}

export function daysSince(iso: string | null | undefined, now = new Date()): number {
  if (!iso) return Infinity;
  return dayIndex(now) - dayIndex(new Date(iso));
}

// "In two days", "Tomorrow", "Today"
export function until(iso: string, now = new Date()): string {
  const days = dayIndex(new Date(iso)) - dayIndex(now);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${spell(days)} days`;
}

// "Thursday, 2 p.m."
export function whenLabel(iso: string): string {
  const d = new Date(iso);
  return `${apWeekday(d)}, ${apTime(d)}`;
}

export function hoursLabel(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(1);
}
