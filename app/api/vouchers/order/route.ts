import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/admin-route";
import { isPaymentConfigured } from "@/modules/vouchers/lib/config";
import { sendPaymentInstructions, notifyOwner, ownerSummary } from "@/modules/vouchers/lib/email";
import { orderToken } from "@/modules/vouchers/lib/service";
import { activeProducts, getVoucherSettings } from "@/modules/vouchers/lib/settings";
import { createOrder } from "@/modules/vouchers/lib/store";
import { validateOrder } from "@/modules/vouchers/lib/validation";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(`voucher-order:${ip}`, 8, 60 * 60))) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }
  const body = await readJson(req);
  if (body instanceof NextResponse) return body;

  const settings = await getVoucherSettings();
  if (!settings.enabled || !isPaymentConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const result = validateOrder(body, activeProducts(settings));
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  const v = result.value;

  const order = await createOrder({
    locale: v.locale,
    product: { id: v.product.id, name: v.product.name[v.locale], details: v.product.details[v.locale], priceCzk: v.product.priceCzk, featured: v.product.featured },
    buyer: v.buyer,
    recipient: v.recipient,
    dedication: v.dedication,
    christmas: settings.christmas,
  });
  const token = await orderToken(order.id);

  // The order page shows the same details, so a failed e-mail must not fail the order.
  try {
    await sendPaymentInstructions(order, token);
  } catch (err) {
    console.error("[vouchers] payment instructions e-mail failed:", err);
  }
  await notifyOwner(`Nová objednávka poukazu (čeká na platbu) — VS ${order.vs}`, ownerSummary(order)).catch(() => {});

  return NextResponse.json({ token });
}
