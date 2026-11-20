import { NextResponse } from "next/server";
import { orderIdFromToken } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

/** Status for the order page's polling. Only what the page needs. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const id = await orderIdFromToken((await params).token);
  const order = id ? await getOrder(id) : null;
  if (!order) return NextResponse.json({ error: "notFound" }, { status: 404 });
  return NextResponse.json(
    { status: order.status, sent: Boolean(order.sentToBuyerAt), code: order.status === "pending" ? undefined : order.code },
    { headers: { "Cache-Control": "no-store" } },
  );
}
