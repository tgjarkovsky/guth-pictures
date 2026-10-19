import { AdminShell } from "@/modules/admin/components/AdminShell";
import { ContentEditor } from "@/modules/admin/components/ContentEditor";

export default async function ObsahPage() {
  return (
    <AdminShell>
      <ContentEditor />
    </AdminShell>
  );
}
