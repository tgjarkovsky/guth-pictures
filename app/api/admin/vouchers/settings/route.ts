import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { getVoucherSettings, setVoucherSettings } from "@/modules/vouchers/lib/settings";
import { parseSettings } from "@/modules/vouchers/lib/settings-validation";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ settings: await getVoucherSettings() });
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (body instanceof NextResponse) return body;
  const parsed = parseSettings(body);
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });
  await setVoucherSettings(parsed);
  revalidatePath("/[locale]/darkovy-poukaz", "page");
  return NextResponse.json({ settings: parsed });
}
