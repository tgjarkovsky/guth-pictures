// No 0/O, 1/I/L — codes are typed by hand from a printed voucher.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateVoucherCode(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = random(8);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `GP-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** Accepts "gp 7kq4m2xd", "GP-7KQ4-M2XD", … and returns the canonical form, or null. */
export function normalizeVoucherCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^GP/, "");
  if (raw.length !== 8 || [...raw].some((c) => !ALPHABET.includes(c))) return null;
  return `GP-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function generateOrderId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Variabilní symbol: 77 + YY + 4-digit sequence, e.g. 77260012. */
export function formatVs(seq: number, year: number): string {
  return `77${String(year % 100).padStart(2, "0")}${String(seq).padStart(4, "0")}`;
}
