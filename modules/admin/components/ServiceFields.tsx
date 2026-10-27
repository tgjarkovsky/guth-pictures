"use client";

import type { ContentData } from "@/modules/admin/lib/content";
import { Field, PackageEditor } from "./FormParts";

type ServiceKey = keyof ContentData["sluzby"];

export function ServiceFields({
  service,
  content,
  patch,
}: {
  service: ServiceKey;
  content: ContentData;
  patch: (updater: (d: ContentData) => void) => void;
}) {
  const s = content.sluzby[service];
  const path = `sluzby.${service}`;
  return (
    <div className="space-y-4">
      <Field
        path={`${path}.title`}
        label="Nadpis služby"
        value={s.title}
        onChange={(v) => patch((d) => { d.sluzby[service].title = v; })}
      />
      <Field
        path={`${path}.desc`}
        label="Popis služby"
        value={s.desc}
        onChange={(v) => patch((d) => { d.sluzby[service].desc = v; })}
        textarea
      />
      <PackageEditor
        path={`${path}.packages`}
        packages={s.packages ?? []}
        onChange={(pkgs) => patch((d) => { d.sluzby[service].packages = pkgs; })}
      />
      <Field
        path={`${path}.note`}
        label="Poznámka pod ceníkem"
        value={s.note ?? ""}
        onChange={(v) => patch((d) => { d.sluzby[service].note = v; })}
      />
    </div>
  );
}
