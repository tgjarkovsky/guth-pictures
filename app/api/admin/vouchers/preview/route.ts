import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { sampleOrder } from "@/modules/vouchers/lib/sample";
import { buildVoucherPdf } from "@/modules/vouchers/lib/service";

/** Sample voucher PDF with the current settings. ?locale=en&balicek=<product id> */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const order = await sampleOrder(q.get("locale") === "en" ? "en" : "cs", q.get("balicek"));
  if (!order) return NextResponse.json({ error: "Kreativní portrét nemá žádný balíček s cenou" }, { status: 404 });
  const pdf = await buildVoucherPdf(order);
  return new NextResponse(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
}
