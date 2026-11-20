import "server-only";

export type IncomingPayment = {
  id: string;        // Fio "ID pohybu"
  date: string;      // YYYY-MM-DD
  amount: number;
  vs: string;
  counterparty?: string;
  message?: string;
};

type FioColumn = { value: string | number | null } | null;
type FioTransaction = Record<string, FioColumn>;

/** Parses Fio's JSON statement into incoming CZK payments. Exported for tests. */
export function parseFioStatement(json: unknown): IncomingPayment[] {
  const list = (json as { accountStatement?: { transactionList?: { transaction?: FioTransaction[] } } })
    ?.accountStatement?.transactionList?.transaction ?? [];
  const val = (t: FioTransaction, col: string) => t[col]?.value ?? null;
  return list
    .map((t) => ({
      id: String(val(t, "column22") ?? ""),
      date: String(val(t, "column0") ?? "").slice(0, 10),
      amount: Number(val(t, "column1") ?? 0),
      currency: String(val(t, "column14") ?? "CZK"),
      vs: String(val(t, "column5") ?? "").replace(/^0+/, ""),
      counterparty: (val(t, "column10") as string | null) ?? undefined,
      message: (val(t, "column16") as string | null) ?? undefined,
    }))
    .filter((p) => p.id && p.amount > 0 && p.currency === "CZK" && p.vs)
    .map(({ currency: _c, ...p }) => p);
}

/**
 * Incoming payments for the last `days` days. Uses the stateless "periods"
 * endpoint (not "last"), so a crash between fetching and processing never
 * loses a payment — every run sees the whole window and dedupes by order state.
 */
export async function fetchIncomingPayments(token: string, days = 21, now = new Date()): Promise<IncomingPayment[]> {
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  const res = await fetch(`https://fioapi.fio.cz/v1/rest/periods/${encodeURIComponent(token)}/${from}/${to}/transactions.json`, {
    cache: "no-store",
  });
  if (res.status === 409) throw new Error("Fio API: příliš časté dotazy (limit 1× za 30 s)");
  if (!res.ok) throw new Error(`Fio API: HTTP ${res.status}`);
  return parseFioStatement(await res.json());
}
