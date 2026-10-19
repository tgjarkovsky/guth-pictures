import { AdminShell } from "@/modules/admin/components/AdminShell";
import { LOCKED } from "@/modules/admin/lib/locked";
import { ThemeEditor } from "@/modules/admin/components/ThemeEditor";

export default function TemaPage() {
  return (
    <AdminShell>
      {LOCKED.has("/admin/tema")
        ? <p className="text-sm text-gray-400">Téma je zatím zamčené. Barvy webu zůstávají, jak jsou.</p>
        : <ThemeEditor />}
    </AdminShell>
  );
}
