"use client";

import type { ContentData } from "@/modules/admin/lib/content";
import { Field, PackageEditor } from "./FormParts";

type ServiceKey = keyof ContentData["sluzby"];
type Service = NonNullable<ContentData["sluzby"][ServiceKey]>;

const blank = (): Service => ({ title: "", desc: "", packages: [] });

export function ServiceFields({
  service,
  content,
  patch,
}: {
  service: ServiceKey;
  content: ContentData;
  patch: (updater: (d: ContentData) => void) => void;
}) {
  const s = content.sluzby[service] ?? blank();
  const edit = (change: (target: Service) => void) => patch((d) => change(d.sluzby[service] ??= blank()));
  const path = `sluzby.${service}`;
  // Conferences have no /sluzby card; their heading and text are events page copy.
  const pricingOnly = service === "conferences";
  return (
    <div className="space-y-4">
      {!pricingOnly && <>
        <Field
          path={`${path}.title`}
          label="Nadpis služby"
          value={s.title}
          onChange={(v) => edit((t) => { t.title = v; })}
        />
        <Field
          path={`${path}.desc`}
          label="Popis služby"
          value={s.desc}
          onChange={(v) => edit((t) => { t.desc = v; })}
          textarea
        />
      </>}
      <PackageEditor
        path={`${path}.packages`}
        packages={s.packages ?? []}
        onChange={(pkgs) => edit((t) => { t.packages = pkgs; })}
      />
      <Field
        path={`${path}.note`}
        label="Poznámka pod ceníkem"
        value={s.note ?? ""}
        onChange={(v) => edit((t) => { t.note = v; })}
      />
    </div>
  );
}
