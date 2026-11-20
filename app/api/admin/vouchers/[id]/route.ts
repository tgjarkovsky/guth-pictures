import { NextResponse } from "next/server";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { deliver, markPaid } from "@/modules/vouchers/lib/service";
import { getOrder, saveOrder } from "@/modules/vouchers/lib/store";

type Body = { action: "markPaid" | "resend" | "invoice" | "redeem" | "unredeem" | "cancel" | "note"; note?: string };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<Body>(req);
  if (body instanceof NextResponse) return body;
  let order = await getOrder((await params).id);
  if (!order) return NextResponse.json({ error: "Objednávka neexistuje" }, { status: 404 });

  switch (body.action) {
    case "markPaid":
      if (order.status !== "pending" && order.status !== "expired") return NextResponse.json({ error: "Objednávka už není nezaplacená" }, { status: 409 });
      order.status = "pending";
      order = await markPaid(order, { amount: order.product.priceCzk, ref: "manual" });
      order = await deliver(order);
      break;
    case "resend":
      if (order.status !== "paid" && order.status !== "redeemed") return NextResponse.json({ error: "Poukaz ještě není zaplacený" }, { status: 409 });
      order.sentToBuyerAt = undefined;
      order.sendAttempts = 0;
      order = await deliver(order);
      break;
    case "invoice":
      if (order.status !== "paid" && order.status !== "redeemed") return NextResponse.json({ error: "Poukaz ještě není zaplacený" }, { status: 409 });
      order.invoiceAttempts = 0;
      order = await deliver(order);
      if (order.invoiceError) return NextResponse.json({ error: order.invoiceError }, { status: 502 });
      break;
    case "redeem":
      if (order.status !== "paid") return NextResponse.json({ error: "Uplatnit lze jen zaplacený poukaz" }, { status: 409 });
      order.status = "redeemed";
      order.redeemedAt = new Date().toISOString();
      await saveOrder(order);
      break;
    case "unredeem":
      if (order.status !== "redeemed") return NextResponse.json({ error: "Poukaz není uplatněný" }, { status: 409 });
      order.status = "paid";
      order.redeemedAt = undefined;
      await saveOrder(order);
      break;
    case "cancel":
      if (order.status === "redeemed") return NextResponse.json({ error: "Uplatněný poukaz nelze stornovat" }, { status: 409 });
      order.status = "cancelled";
      order.cancelledAt = new Date().toISOString();
      await saveOrder(order);
      break;
    case "note":
      order.adminNote = typeof body.note === "string" ? body.note.slice(0, 500) : undefined;
      await saveOrder(order);
      break;
    default:
      return NextResponse.json({ error: "Neznámá akce" }, { status: 400 });
  }
  return NextResponse.json({ order });
}
