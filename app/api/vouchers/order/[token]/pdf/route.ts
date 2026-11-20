import { NextRequest, NextResponse } from "next/server";
import { buildReceiptPdf, buildVoucherPdf, orderIdFromToken } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const id = await orderIdFromToken((await params).token);
  const order = id ? await getOrder(id) : null;
  if (!order) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (order.status !== "paid" && order.status !== "redeemed") return NextResponse.json({ error: "notPaid" }, { status: 409 });

  const receipt = req.nextUrl.searchParams.get("doc") === "receipt";
  const pdf = receipt ? await buildReceiptPdf(order) : await buildVoucherPdf(order);
  const name = receipt ? `doklad-${order.docNumber}.pdf` : `darkovy-poukaz-${order.code}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
