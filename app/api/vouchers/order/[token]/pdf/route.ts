import { NextRequest, NextResponse } from "next/server";
import { getInvoicePdf, buildVoucherPdf, orderIdFromToken } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const id = await orderIdFromToken((await params).token);
  const order = id ? await getOrder(id) : null;
  if (!order) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (order.status !== "paid" && order.status !== "redeemed") return NextResponse.json({ error: "notPaid" }, { status: 409 });

  const invoice = req.nextUrl.searchParams.get("doc") === "invoice";
  if (invoice && !order.invoiceNumber) return NextResponse.json({ error: "Faktura ještě nebyla vystavena" }, { status: 404 });
  let pdf: Uint8Array;
  try {
    pdf = invoice ? await getInvoicePdf(order) : await buildVoucherPdf(order);
  } catch (err) {
    console.error("[vouchers] pdf failed:", err);
    return NextResponse.json({ error: "PDF se teď nepodařilo připravit, zkuste to za chvíli" }, { status: 502 });
  }
  const name = invoice ? `faktura-${order.invoiceNumber}.pdf` : `darkovy-poukaz-${order.code}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
