import { NextRequest, NextResponse } from "next/server";
import { runVoucherJobs } from "@/modules/vouchers/lib/service";

export const maxDuration = 120;

/** Payment check + voucher delivery. Triggered every 10 minutes by .github/workflows/vouchers-cron.yml. */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const report = await runVoucherJobs();
  return NextResponse.json(report, { status: report.errors.length ? 207 : 200 });
}
