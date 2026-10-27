import { AdminShell } from "@/modules/admin/components/AdminShell";
import { PozyAdmin } from "@/modules/admin/components/PozyAdmin";
import { listPoseLinks } from "@/modules/pozy/lib/picks";
import poses from "@/tools/pose-pack/poses.json";

export default async function PozyAdminPage() {
  const links = await listPoseLinks();
  const list = poses.map(({ id, tags, shot, label }) => ({ id, tags, shot, label }));
  return (
    <AdminShell>
      <PozyAdmin poses={list} links={links} />
    </AdminShell>
  );
}
