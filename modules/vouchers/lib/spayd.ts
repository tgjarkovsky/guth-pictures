// Czech "QR Platba" (SPAYD 1.0) — https://qr-platba.cz/pro-vyvojare/specifikace-formatu/

const clean = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\*/g, "").replace(/[^\x20-\x7E]/g, "").trim();

export function spayd({ iban, amount, vs, message, recipient }: {
  iban: string;
  amount: number;
  vs: string;
  message?: string;
  recipient?: string;
}): string {
  const parts = [
    "SPD", "1.0",
    `ACC:${iban.replace(/\s+/g, "").toUpperCase()}`,
    `AM:${amount.toFixed(2)}`,
    "CC:CZK",
    `X-VS:${vs}`,
  ];
  if (recipient) parts.push(`RN:${clean(recipient).slice(0, 35)}`);
  if (message) parts.push(`MSG:${clean(message).slice(0, 60)}`);
  return parts.join("*");
}

/** "CZ65 0800 0000 1920 0014 5399" → "19-2000145399/0800" (only for display). */
export function ibanToLocal(iban: string): string {
  const s = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^CZ\d{22}$/.test(s)) return iban;
  const bank = s.slice(4, 8);
  const prefix = s.slice(8, 14).replace(/^0+/, "");
  const number = s.slice(14).replace(/^0+/, "");
  return `${prefix ? `${prefix}-` : ""}${number}/${bank}`;
}
