import "server-only";
import { voucherConfig } from "./config";
import { pragueDate } from "./dates";
import type { VoucherOrder } from "./types";

// Invoices live in Fakturáček (tgjarkovsky/fakturacek), next to every other invoice — one place for taxes.

export const invoiceRef = (order: Pick<VoucherOrder, "id">) => `voucher:${order.id}`;

function endpoint(path: string) {
  const c = voucherConfig();
  if (!c.fakturacekUrl || !c.fakturacekToken) throw new Error("Fakturáček není nastavený (FAKTURACEK_URL, FAKTURACEK_API_TOKEN)");
  return { url: `${c.fakturacekUrl}${path}`, headers: { authorization: `Bearer ${c.fakturacekToken}` } };
}

async function errorText(res: Response) {
  const body = await res.json().catch(() => null);
  return `Fakturáček: HTTP ${res.status}${body?.error ? ` — ${body.error}` : ""}`;
}

/** Issued + paid invoice for the voucher. Idempotent in Fakturáček, so retries never create a second one. */
export async function createVoucherInvoice(order: VoucherOrder): Promise<{ number: string; pdf: Uint8Array }> {
  if (!order.paidAt) throw new Error("Objednávka není zaplacená");
  const { url, headers } = endpoint("/api/external/invoices");
  const cs = order.locale === "cs";
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      externalRef: invoiceRef(order),
      customer: { name: order.buyer.name, email: order.buyer.email },
      items: [
        {
          description: `${cs ? "Dárkový poukaz" : "Gift voucher"}: ${order.product.name}${order.code ? ` (${order.code})` : ""}`,
          quantity: 1,
          unit: cs ? "ks" : "pc",
          unitPrice: order.paidAmount ?? order.product.priceCzk,
        },
      ],
      paidAt: pragueDate(new Date(order.paidAt)),
      currency: "CZK",
      language: order.locale,
      note: order.validUntil ? `${cs ? "Platnost poukazu do" : "Voucher valid until"} ${order.validUntil}` : undefined,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(await errorText(res));
  const data = (await res.json()) as { number: string; pdf: string };
  return { number: data.number, pdf: new Uint8Array(Buffer.from(data.pdf, "base64")) };
}

export async function fetchVoucherInvoicePdf(order: VoucherOrder): Promise<Uint8Array> {
  const { url, headers } = endpoint(`/api/external/invoices/${encodeURIComponent(invoiceRef(order))}/pdf`);
  const res = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(await errorText(res));
  return new Uint8Array(await res.arrayBuffer());
}
