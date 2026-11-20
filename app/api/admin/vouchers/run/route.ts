import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { runVoucherJobs } from "@/modules/vouchers/lib/service";

export const maxDuration = 120;

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json(await runVoucherJobs());
}
