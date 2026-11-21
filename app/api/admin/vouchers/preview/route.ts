import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { buildVoucherPdf } from "@/modules/vouchers/lib/service";
import { addMonths, pragueDate } from "@/modules/vouchers/lib/dates";
import { activeProducts, getVoucherSettings } from "@/modules/vouchers/lib/settings";
import type { VoucherOrder } from "@/modules/vouchers/lib/types";

/** Sample voucher with the current settings — for checking the photo and the Christmas switch. */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const settings = await getVoucherSettings();
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "cs";
  const product = activeProducts(settings)[0];
  if (!product) return NextResponse.json({ error: "Kreativní portrét nemá žádný balíček s cenou" }, { status: 404 });
  const sample = {
    id: "preview", vs: "77000000", locale, status: "paid", createdAt: new Date().toISOString(),
    product: { id: product.id, name: product.name[locale], details: product.details[locale], priceCzk: product.priceCzk },
    buyer: { name: "Petr", email: "petr@example.com" },
    recipient: { name: locale === "cs" ? "Jana Nováková" : "Jane Doe" },
    dedication: locale === "cs" ? "Ať máš konečně fotky, na kterých se líbíš sama sobě. Petr" : "For the photos you've always wanted. Love, Peter",
    christmas: settings.christmas,
    code: "GP-7KQ4-M2XD",
    validUntil: addMonths(pragueDate(), settings.validityMonths),
  } satisfies VoucherOrder;
  const pdf = await buildVoucherPdf(sample);
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
}
