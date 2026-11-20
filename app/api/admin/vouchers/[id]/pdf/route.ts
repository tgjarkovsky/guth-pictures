import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { buildReceiptPdf, buildVoucherPdf } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const order = await getOrder((await params).id);
  if (!order?.code) return NextResponse.json({ error: "Poukaz ještě nebyl vystaven" }, { status: 404 });
  const receipt = req.nextUrl.searchParams.get("doc") === "receipt";
  const pdf = receipt ? await buildReceiptPdf(order) : await buildVoucherPdf(order);
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${receipt ? `doklad-${order.docNumber}` : order.code}.pdf"`, "Cache-Control": "no-store" },
  });
}
