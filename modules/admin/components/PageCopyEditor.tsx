"use client";

import { useId } from "react";
import { HIDDEN, labelFor } from "@/modules/admin/lib/content-tree";

// Renders a form for any copy tree (texts, lists, FAQ) based on the shape of its defaults.
type Value = string | Value[] | { [key: string]: Value };

const blank = (template: Value): Value =>
  typeof template === "string" ? ""
    : Array.isArray(template) ? []
    : Object.fromEntries(Object.entries(template).map(([key, value]) => [key, blank(value)]));

const inputClass = "w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40";
const smallButton = "text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30";

function TextField({ path, label, value, long, onChange }: { path: string; label: string; value: string; long: boolean; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div data-path={path}>
      <label htmlFor={id} className="block text-sm text-gray-400 mb-1">{label}</label>
      {long ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}

// First text inside a list item, used as its collapsed one-line title.
const firstText = (value: Value): string =>
  typeof value === "string" ? value
    : Array.isArray(value) ? (value.length ? firstText(value[0]) : "")
    : firstText(Object.values(value)[0] ?? "");

function ListField({ path, name, label, value, template, onChange }: {
  path: string; name: string; label: string; value: Value[]; template: Value[]; onChange: (v: Value[]) => void;
}) {
  const item = template[0] ?? "";
  return (
    <div className="space-y-2" data-path={path}>
      <p className="text-sm text-gray-400">{label}</p>
      {value.map((entry, i) => (
        <details key={i} data-path={`${path}.${i}`} className="group border border-white/10">
          <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-white/5">
            <span className="text-xs text-gray-500">{i + 1}.</span>
            <span className="truncate flex-1">{firstText(entry) || <em className="text-gray-500">prázdné</em>}</span>
            <span className="text-gray-500 group-open:rotate-90 transition-transform">›</span>
          </summary>
          <div className="space-y-2 border-t border-white/10 p-3">
            <Node path={`${path}.${i}`} name={name} label="" value={entry} template={item} onChange={(next) => onChange(value.map((v, idx) => (idx === i ? next : v)))} />
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Odebrat
            </button>
          </div>
        </details>
      ))}
      <button type="button" onClick={() => onChange([...value, blank(item)])} className={smallButton}>+ Přidat</button>
    </div>
  );
}

function Node({ path, name, label, value, template, onChange }: {
  path: string; name: string; label: string; value: Value; template: Value; onChange: (v: Value) => void;
}) {
  if (typeof template === "string") {
    return <TextField path={path} label={label || "Text"} value={typeof value === "string" ? value : ""} long={template.length > 80} onChange={onChange} />;
  }
  if (Array.isArray(template)) {
    return <ListField path={path} name={name} label={label} value={Array.isArray(value) ? value : []} template={template} onChange={onChange} />;
  }
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return (
    <div className="space-y-4">
      {Object.entries(template).filter(([key]) => !HIDDEN.has(key)).map(([key, child]) => (
        <Node
          key={key}
          path={`${path}.${key}`}
          name={key}
          label={labelFor(name, key)}
          value={record[key] ?? blank(child)}
          template={child}
          onChange={(next) => onChange({ ...record, [key]: next })}
        />
      ))}
    </div>
  );
}

// `path` is the field's dot path in ContentData (data-path target for preview clicks).
export function PageCopyEditor({ path, label, value, template, onChange }: {
  path: string; label: string; value: unknown; template: unknown; onChange: (v: unknown) => void;
}) {
  return (
    <Node
      path={path}
      name={path.split(".").at(-1) ?? ""}
      label={label}
      value={value as Value}
      template={template as Value}
      onChange={onChange}
    />
  );
}
