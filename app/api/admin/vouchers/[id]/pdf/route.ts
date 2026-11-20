import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { getInvoicePdf, buildVoucherPdf } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const order = await getOrder((await params).id);
  if (!order?.code) return NextResponse.json({ error: "Poukaz ještě nebyl vystaven" }, { status: 404 });
  const invoice = req.nextUrl.searchParams.get("doc") === "invoice";
  if (invoice && !order.invoiceNumber) return NextResponse.json({ error: "Faktura ještě nebyla vystavena" }, { status: 404 });
  let pdf: Uint8Array;
  try {
    pdf = invoice ? await getInvoicePdf(order) : await buildVoucherPdf(order);
  } catch (err) {
    console.error("[vouchers] pdf failed:", err);
    return NextResponse.json({ error: "PDF se teď nepodařilo připravit, zkuste to za chvíli" }, { status: 502 });
  }
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${invoice ? `faktura-${order.invoiceNumber}` : order.code}.pdf"`, "Cache-Control": "no-store" },
  });
}
