import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { renderCardPng } from "@/modules/vouchers/lib/render";
import { sampleOrder } from "@/modules/vouchers/lib/sample";
import { voucherCard } from "@/modules/vouchers/lib/service";

/** Card sides for the admin preview of the gift page: front.png / back.png. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const file = (await params).file;
  if (file !== "front.png" && file !== "back.png") return new Response(null, { status: 404 });
  const q = req.nextUrl.searchParams;
  const order = await sampleOrder(q.get("locale") === "en" ? "en" : "cs", q.get("balicek"));
  if (!order) return new Response(null, { status: 404 });
  const png = await renderCardPng(await voucherCard(order), file === "front.png" ? "front" : "back", 1.5);
  return new NextResponse(Buffer.from(png), { headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" } });
}
