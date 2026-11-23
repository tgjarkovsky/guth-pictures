import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { giftUrl } from "@/modules/vouchers/lib/service";
import { getOrder } from "@/modules/vouchers/lib/store";

/** Opens the recipient's gift page of a real order. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const order = await getOrder((await params).id);
  if (!order?.code) return NextResponse.json({ error: "Poukaz ještě nebyl vystaven" }, { status: 404 });
  const url = new URL(await giftUrl(order));
  return NextResponse.redirect(new URL(url.pathname, _req.url));
}
