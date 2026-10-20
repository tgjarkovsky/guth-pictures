"use client";

import { useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { TestimonialService } from "@/modules/admin/lib/content";
import { emptyReference, type Reference } from "@/modules/admin/lib/references";

const input = "w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40";
const button = "text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30";

// Client photos with their review for one page (homepage = creative, business). Edits the full list,
// shows only this service's entries; order among them is the order on the site.
export function ReferenceEditor({ service, refs, onChange, photos }: {
  service: TestimonialService;
  refs: Reference[];
  onChange: (refs: Reference[]) => void;
  photos: GalleryPhoto[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const shown = refs.filter((r) => r.service === service);

  const update = (id: string, patch: Partial<Reference>) =>
    onChange(refs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  // Puts shown[from] in shown[to]'s place; other pages' references keep their positions.
  function moveTo(from: number, to: number) {
    const target = shown[to];
    if (from === to || !target) return;
    const rest = refs.filter((r) => r !== shown[from]);
    const at = rest.indexOf(target) + (to > from ? 1 : 0);
    onChange([...rest.slice(0, at), shown[from], ...rest.slice(at)]);
  }

  function drop(to: number) {
    if (dragIndex !== null) moveTo(dragIndex, to);
    setDragIndex(null);
    setOverIndex(null);
  }

  function add() {
    const ref = emptyReference(service);
    setOpenId(ref.id);
    onChange([...refs, ref]);
  }

  async function upload(id: string, file: File) {
    setUploadingId(id);
    setErrorId(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { publicId } = await res.json();
      update(id, { photo: publicId });
    } catch {
      setErrorId(id);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Na webu se ukážou reference s fotkou a jménem. Citace je volitelná, zvlášť pro CS a EN; když je vyplněná jen jedna, druhý jazyk referenci neukáže. Fotka, jméno a pořadí platí pro oba jazyky. Pořadí změníš přetažením řádku nebo šipkami.
      </p>
      {shown.map((r, i) => (
        <details key={r.id} open={r.id === openId}
          onDragOver={(e) => { if (dragIndex === null) return; e.preventDefault(); setOverIndex(i); }}
          onDrop={(e) => { e.preventDefault(); drop(i); }}
          className={`group border ${overIndex === i && dragIndex !== i ? "border-white/60" : "border-white/10"} ${dragIndex === i ? "opacity-40" : ""}`}>
          <summary draggable
            onDragStart={(e) => { e.dataTransfer?.setData("text/plain", r.id); setDragIndex(i); }}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
            className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-white/5">
            <span aria-hidden className="cursor-grab text-gray-500" title="Přetáhnout">⠿</span>
            {r.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={cloudinaryUrl(r.photo, "w_64,h_64,c_fill,g_face,q_auto,f_auto")} alt="" className="h-8 w-8 flex-none object-cover" />
              : <span className="h-8 w-8 flex-none bg-zinc-800" />}
            <span className="flex-1 truncate">
              {r.author || <em className="text-gray-500">nová reference</em>}
              {r.quote.cs && <span className="text-gray-500"> · {r.quote.cs}</span>}
            </span>
            {!r.photo && <span className="text-xs text-amber-400">bez fotky</span>}
            <span className="flex gap-1">
              {([[-1, "Posunout nahoru", "↑", i === 0], [1, "Posunout dolů", "↓", i === shown.length - 1]] as const).map(([offset, label, arrow, disabled]) => (
                <button key={offset} type="button" aria-label={`${label}: ${r.author || "nová reference"}`} disabled={disabled}
                  onClick={(e) => { e.preventDefault(); moveTo(i, i + offset); }}
                  className="px-1.5 text-gray-400 hover:text-white disabled:opacity-20">{arrow}</button>
              ))}
            </span>
            <span className="text-gray-500 group-open:rotate-90 transition-transform">›</span>
          </summary>
          <div className="space-y-3 border-t border-white/10 p-3">
            <div className="flex flex-wrap items-center gap-2">
              {photos.length > 0 && (
                <button type="button" aria-label={`Vybrat fotku: ${r.author || "nová reference"}`} onClick={() => setPickerId(pickerId === r.id ? null : r.id)} className={button}>
                  {pickerId === r.id ? "Zavřít výběr" : "Vybrat z knihovny"}
                </button>
              )}
              <label className={`${button} cursor-pointer`}>
                {uploadingId === r.id ? "Nahrávám…" : "Nahrát novou"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingId === r.id}
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(r.id, file); e.target.value = ""; }} />
              </label>
              {r.photo && <button type="button" onClick={() => update(r.id, { photo: "" })} className="text-xs text-gray-400 hover:text-white">Odebrat fotku</button>}
              {errorId === r.id && <span className="text-xs text-red-400">Nahrávání selhalo</span>}
            </div>
            {pickerId === r.id && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-80 overflow-y-auto border border-white/10 p-2">
                {photos.map((p) => (
                  <button key={p.publicId} type="button" aria-label={`Použít ${p.alt.cs || p.publicId}`}
                    onClick={() => { update(r.id, { photo: p.publicId }); setPickerId(null); }}
                    className={p.publicId === r.photo ? "ring-2 ring-white" : "opacity-80 hover:opacity-100"}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cloudinaryUrl(p.publicId, "w_160,h_160,c_fill,g_face,q_auto,f_auto")} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <input aria-label="Jméno" placeholder="Jméno (autor)" value={r.author} onChange={(e) => update(r.id, { author: e.target.value })} className={input} />
            <div className="grid gap-2 sm:grid-cols-2">
              {(["cs", "en"] as const).map((l) => (
                <div key={l} className="space-y-2">
                  <textarea aria-label={`Citace ${l.toUpperCase()}`} placeholder={`Citace ${l.toUpperCase()}`} rows={3} value={r.quote[l]}
                    onChange={(e) => update(r.id, { quote: { ...r.quote, [l]: e.target.value } })} className={`${input} resize-y`} />
                  <input aria-label={`Role ${l.toUpperCase()}`} placeholder={`Role / popis ${l.toUpperCase()} (volitelné)`} value={r.role[l]}
                    onChange={(e) => update(r.id, { role: { ...r.role, [l]: e.target.value } })} className={input} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button type="button" onClick={() => onChange(refs.filter((x) => x.id !== r.id))} disabled={uploadingId === r.id}
                className="ml-auto text-xs text-red-400 hover:text-red-300 disabled:opacity-40">
                Odebrat referenci
              </button>
            </div>
          </div>
        </details>
      ))}
      <button type="button" onClick={add} className={button}>+ Přidat referenci</button>
    </div>
  );
}
