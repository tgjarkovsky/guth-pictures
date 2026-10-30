import type { PropsWithChildren } from "react";
import { EditorialNav } from "./EditorialNav";

// Full-viewport apps (3D stage, simulator): editorial tokens and nav, but no container
// containment — it would turn the shell into the containing block for their fixed layers.
export function ToolShell({ children }: PropsWithChildren) {
  return (
    <main className="editorial-secondary editorial-tool" data-world="secondary">
      <EditorialNav tone="light" active="tools" />
      {children}
    </main>
  );
}
