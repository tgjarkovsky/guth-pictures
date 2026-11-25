import { NextResponse, after } from "next/server";
import { readJson } from "@/lib/admin-route";
import { checkRateLimit } from "@/lib/rate-limit";
import { isVoucherTheme } from "@/modules/vouchers/lib/design";
import { canChangeTheme, orderIdFromToken, runVoucherJobs } from "@/modules/vouchers/lib/service";
import { claimOnDemandCheck, getOrder, saveOrder } from "@/modules/vouchers/lib/store";

export const maxDuration = 60;

/**
 * Status for the order page's polling. Only what the page needs.
 * While someone waits on an unpaid or unsent order, it also nudges the payment check — at most
 * once a minute site-wide — so the voucher doesn't wait for GitHub's (often late) scheduled run.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const id = await orderIdFromToken((await params).token);
  const order = id ? await getOrder(id) : null;
  if (!order) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (order.status === "pending" || (order.status === "paid" && !order.sentToBuyerAt)) {
    after(async () => {
      try {
        if (await claimOnDemandCheck()) await runVoucherJobs();
      } catch (err) {
        console.error("[vouchers] on-demand check failed:", err);
      }
    });
  }
  return NextResponse.json(
    { status: order.status, sent: Boolean(order.sentToBuyerAt), code: order.status === "pending" ? undefined : order.code },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** The buyer picks the voucher design: { theme }. Allowed until the voucher is e-mailed. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (!(await checkRateLimit(`voucher-theme:${token.slice(0, 18)}`, 30, 60 * 60))) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }
  const body = await readJson<{ theme?: unknown }>(req);
  if (body instanceof NextResponse) return body;
  if (!isVoucherTheme(body.theme)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const id = await orderIdFromToken(token);
  const order = id ? await getOrder(id) : null;
  if (!order) return NextResponse.json({ error: "notFound" }, { status: 404 });
  if (!canChangeTheme(order)) return NextResponse.json({ error: "locked" }, { status: 409 });
  order.theme = body.theme;
  await saveOrder(order);
  return NextResponse.json({ theme: order.theme });
}
