"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./FormParts";
import { messageClass, useAdminAction } from "./useAdminAction";
import { filterPoses, uniqueValues, type Pose } from "@/modules/pozy/filter";
import type { PoseLink } from "@/modules/pozy/lib/picks";

const linkUrl = (slug: string) => `${window.location.origin}/cs/pozy/${slug}`;

function Thumb({ pose, dim }: { pose: Pose; dim?: boolean }) {
  return (
    // Local static file — the global next/image loader is Cloudinary-only
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/poses/${pose.id}.jpg`} alt={pose.label} title={pose.label} loading="lazy" className={`aspect-[4/5] w-full object-cover ${dim ? "opacity-30" : ""}`} />
  );
}

export function PozyAdmin({ poses, links }: { poses: Pose[]; links: PoseLink[] }) {
  const router = useRouter();
  const { busy, message, run } = useAdminAction();
  const [client, setClient] = useState("");
  const [tag, setTag] = useState<string>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const byId = new Map(poses.map((p) => [p.id, p]));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const create = () =>
    run(
      "/api/admin/pozy",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client, poseIds: [...selected] }) },
      {
        onSuccess: ({ link }) => {
          navigator.clipboard?.writeText(linkUrl(link.slug)).catch(() => {});
          setClient("");
          setSelected(new Set());
          router.refresh();
          return "Odkaz vytvořen a zkopírován";
        },
      }
    );

  const remove = (slug: string) =>
    run(`/api/admin/pozy/${slug}`, { method: "DELETE" }, { onSuccess: () => router.refresh() });

  const chip = (active: boolean) =>
    `px-3 py-1 text-sm border ${active ? "bg-white text-black border-white" : "border-white/10 text-gray-400 hover:text-white"}`;

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Nový odkaz</h2>
        <Field label="Klient" value={client} onChange={setClient} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(!tag)} onClick={() => setTag(undefined)}>vše</button>
          {uniqueValues(poses.flatMap((p) => p.tags)).map((t) => (
            <button key={t} type="button" className={chip(tag === t)} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {filterPoses(poses, { tag }).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={selected.has(p.id)}
                onClick={() => toggle(p.id)}
                className={`block w-full border-2 ${selected.has(p.id) ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <Thumb pose={p} />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={busy || !client.trim() || selected.size === 0}
            onClick={create}
            className="bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            Vytvořit odkaz ({selected.size})
          </button>
          {message && <span className={`text-sm ${messageClass(message)}`}>{message}</span>}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Odkazy</h2>
        {links.length === 0 && <p className="text-sm text-gray-500">Zatím žádné.</p>}
        {links.map((l) => {
          const picked = new Set(l.picks?.ids);
          return (
            <article key={l.slug} className="space-y-3 border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{l.client}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(l.createdAt).toLocaleDateString("cs-CZ")} · {l.poseIds.length} póz ·{" "}
                    {l.picks ? `vybráno ${l.picks.ids.length} (${new Date(l.picks.updatedAt).toLocaleString("cs-CZ")})` : "klient zatím nevybral"}
                  </p>
                </div>
                <div className="flex gap-2 text-sm">
                  <button type="button" onClick={() => navigator.clipboard?.writeText(linkUrl(l.slug))} className="border border-white/10 px-3 py-1 text-gray-300 hover:text-white">
                    Kopírovat odkaz
                  </button>
                  <a href={`/cs/pozy/${l.slug}`} target="_blank" rel="noreferrer" className="border border-white/10 px-3 py-1 text-gray-300 hover:text-white">
                    Otevřít
                  </a>
                  <button type="button" disabled={busy} onClick={() => remove(l.slug)} className="border border-red-500/30 px-3 py-1 text-red-400 hover:text-red-300">
                    Smazat
                  </button>
                </div>
              </div>
              <ul className="grid grid-cols-6 gap-2 md:grid-cols-10">
                {l.poseIds.map((id) => byId.get(id)).filter((p): p is Pose => !!p).map((p) => (
                  <li key={p.id} className={picked.has(p.id) ? "ring-2 ring-white" : ""}>
                    <Thumb pose={p} dim={!!l.picks && !picked.has(p.id)} />
                  </li>
                ))}
              </ul>
              {l.picks?.note && <p className="whitespace-pre-wrap text-sm text-gray-300">„{l.picks.note}“</p>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
