import { AdminShell } from "@/modules/admin/components/AdminShell";
import { LOCKED } from "@/modules/admin/lib/locked";
import { AdminProposalList } from "@/modules/brand-shoot/components/AdminProposalList";
import { listProposals } from "@/modules/brand-shoot/lib/proposals";

export const dynamic = "force-dynamic";

export default async function NavrhyPage() {
  if (LOCKED.has("/admin/navrhy")) return <AdminShell><p className="text-sm text-gray-400">Návrhy jsou zatím zamčené.</p></AdminShell>;
  const proposals = await listProposals();
  return (
    <AdminShell>
      <AdminProposalList
        proposals={proposals.map((p) => ({
          slug: p.slug,
          name: p.name,
          locale: p.locale,
          finalized: p.finalized,
          hasPassword: !!p.passwordHash,
          approvedConcepts: p.concepts.filter((c) => c.status === "approved").length,
          conceptCount: p.concepts.length,
          syncedAt: p.syncedAt,
          feedbackCount: p.feedback?.length ?? 0,
          firstOpenedAt: p.firstOpenedAt,
          hasNewChanges: !!p.syncedAt && (!p.reviewedAt || p.syncedAt > p.reviewedAt),
        }))}
      />
    </AdminShell>
  );
}
