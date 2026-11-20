import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { listOrders } from "@/modules/vouchers/lib/store";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ orders: await listOrders() }, { headers: { "Cache-Control": "no-store" } });
}
