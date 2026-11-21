import { NextResponse } from "next/server";
import { renderCardPng } from "@/modules/vouchers/lib/render";
import { buildVoucherPdf, orderIdFromGiftToken, voucherCard } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

/** The recipient's link: front.png / back.png for the web card, poukaz.pdf to print. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string; file: string }> }) {
  const { token, file } = await params;
  if (!["front.png", "back.png", "poukaz.pdf"].includes(file)) return new Response(null, { status: 404 });
  const id = await orderIdFromGiftToken(token);
  const order = id ? await getOrder(id) : null;
  if (!order || (order.status !== "paid" && order.status !== "redeemed")) return new Response(null, { status: 404 });

  try {
    if (file === "poukaz.pdf") {
      return new NextResponse(Buffer.from(await buildVoucherPdf(order)), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="darkovy-poukaz-${order.code}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    const png = await renderCardPng(await voucherCard(order), file === "front.png" ? "front" : "back", 1.5);
    return new NextResponse(Buffer.from(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" },
    });
  } catch (err) {
    console.error("[vouchers] gift file failed:", err);
    return new Response(null, { status: 502 });
  }
}
