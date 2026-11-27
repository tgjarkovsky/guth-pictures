import { NextRequest, NextResponse } from "next/server";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { getDrafts, saveDrafts } from "@/modules/stories/lib/store";
import type { StoryDraft } from "@/modules/stories/lib/types";
import { activeProducts, getVoucherSettings } from "@/modules/vouchers/lib/settings";

/** „od 2 900 Kč“ podle nejlevnějšího aktivního poukazu; prázdné, když žádný není. */
async function voucherPriceFrom(): Promise<string> {
  const prices = activeProducts(await getVoucherSettings()).map(p => p.priceCzk);
  if (!prices.length) return "";
  return `od ${Math.min(...prices).toLocaleString("cs-CZ").replace(/\s/g, "\u00a0")}\u00a0Kč`;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ drafts: await getDrafts() });
}

// vytvoření ručního návrhu
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<{ template?: unknown }>(req);
  if (body instanceof NextResponse) return body;
  const template = body.template === "D" || body.template === "P" ? body.template : "C";
  const draft: StoryDraft = {
    id: `d-${Date.now()}`,
    template,
    photos: [], headline: "", sub: "", words: [], subHeadline: "",
    textSource: "manual",
    createdAt: new Date().toISOString(),
    ...(template === "P" && { price: await voucherPriceFrom(), voucherTheme: "snow", format: "story" }),
  };
  const drafts = await getDrafts();
  await saveDrafts([draft, ...drafts]);
  return NextResponse.json({ draft });
}

// úprava návrhu (full replace podle id)
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (body instanceof NextResponse) return body;
  const { draft } = body as { draft?: StoryDraft };
  if (!draft?.id) return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  const drafts = await getDrafts();
  if (!drafts.some(d => d.id === draft.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await saveDrafts(drafts.map(d => (d.id === draft.id ? draft : d)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const drafts = await getDrafts();
  await saveDrafts(drafts.filter(d => d.id !== id));
  return NextResponse.json({ ok: true });
}
