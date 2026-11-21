import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/github-oidc";
import { runVoucherJobs } from "@/modules/vouchers/lib/service";

export const maxDuration = 120;

/**
 * Payment check + voucher delivery. Triggered every 10 minutes by .github/workflows/vouchers-cron.yml,
 * which authenticates with a GitHub OIDC token (no stored secret); CRON_SECRET works for manual calls.
 */
export async function GET(req: NextRequest) {
  if (!(await isAuthorizedCron(req.headers.get("authorization")))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const report = await runVoucherJobs();
  return NextResponse.json(report, { status: report.errors.length ? 207 : 200 });
}
