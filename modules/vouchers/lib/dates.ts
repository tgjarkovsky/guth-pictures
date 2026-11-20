const TZ = "Europe/Prague";

/** Today's date in Prague as YYYY-MM-DD. */
export function pragueDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function formatDate(isoDate: string, locale: "cs" | "en"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return locale === "cs" ? `${d}. ${m}. ${y}` : new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function daysBetween(fromIso: string, to: Date = new Date()): number {
  return (to.getTime() - new Date(fromIso).getTime()) / 86_400_000;
}

export function formatCzk(amount: number, locale: "cs" | "en"): string {
  const n = new Intl.NumberFormat("cs-CZ").format(amount).replace(/ /g, " ");
  return locale === "cs" ? `${n} Kč` : `CZK ${n}`;
}
