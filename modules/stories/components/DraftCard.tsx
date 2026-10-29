"use client";

import { useRef, useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft } from "../lib/types";
import { DraftPhotoList } from "./DraftPhotoList";
import { StoryTemplate } from "./story/StoryTemplate";
import { useStoryExport } from "./story/useStoryExport";
import type { Photo } from "./story/types";

const W = 1080;
const H = 1920;
const PREVIEW_SCALE = 420 / H;
const FIELD = "w-full bg-zinc-900 border border-white/20 px-2 py-1";
const SAFE_BAND = { position: "absolute", left: 0, right: 0, height: 250 * PREVIEW_SCALE, background: "rgba(255,60,60,0.22)" } as const;

export function DraftCard({ draft, galleryPhotos, onChanged }: {
  draft: StoryDraft;
  galleryPhotos: GalleryPhoto[];
  onChanged: () => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [publishAt, setPublishAt] = useState("");
  const [paused, setPaused] = useState(false);
  const [chromePreview, setChromePreview] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const duration = d.durationMs ?? 2400;
  const lang = d.lang ?? "cs";
  const photos: Photo[] = d.photos.map(p => ({
    url: cloudinaryUrl(p.publicId, "w_1080,h_1920,c_fill,q_auto,f_jpg"),
    x: p.x, y: p.y,
  }));

  const slideCount = Math.max(d.template === "C" ? d.photos.length : d.words.filter(Boolean).length, 1);
  const { exporting, progress, exportTick, exportLayer, canRender, downloadMp4, approve } =
    useStoryExport(d, { publishAt, onChanged, exportRef, slideCount, duration });

  const templateProps = { draft: d, photos, duration, paused, lang } as const;
  function patch(p: Partial<StoryDraft>) { setD(prev => ({ ...prev, ...p })); }

  async function save() {
    await fetch("/api/admin/stories/drafts", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: d }),
    });
    await onChanged();
  }

  async function remove() {
    await fetch(`/api/admin/stories/drafts?id=${d.id}`, { method: "DELETE" });
    await onChanged();
  }

  return (
    <div className="flex gap-6 border border-white/10 p-4">
      {/* preview */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-lg cursor-pointer"
          style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
          onClick={() => setPaused(p => !p)} title="Kliknutím pauza/play">
          <StoryTemplate {...templateProps} chrome={chromePreview} scale={PREVIEW_SCALE} />
          {showSafeZone && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
              <div style={{ ...SAFE_BAND, top: 0, borderBottom: "1px solid rgba(255,80,80,0.7)" }} />
              <div style={{ ...SAFE_BAND, bottom: 0, borderTop: "1px solid rgba(255,80,80,0.7)" }} />
            </div>
          )}
        </div>
        <label className="flex items-center gap-1 mt-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showSafeZone} onChange={e => setShowSafeZone(e.target.checked)} />
          safe zone
        </label>
      </div>

      {/* editace */}
      <div className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <select value={d.template} onChange={e => patch({ template: e.target.value as "C" | "D" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="C">Šablona C</option>
            <option value="D">Šablona D</option>
          </select>
          <select value={lang} onChange={e => patch({ lang: e.target.value as "cs" | "en" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="cs">CZ</option>
            <option value="en">EN</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={chromePreview} onChange={e => setChromePreview(e.target.checked)} />
            IG chrome (náhled)
          </label>
          {d.textSource === "ai" && <span className="text-xs text-purple-400">AI text</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Délka snímku · {duration} ms</span>
          <input type="range" min={800} max={5000} step={100} value={duration}
            onChange={e => patch({ durationMs: +e.target.value })} className="flex-1" />
        </div>

        {d.template === "C" ? (
          <>
            <textarea value={d.headline} onChange={e => patch({ headline: e.target.value })}
              placeholder="Headline" rows={2} className={FIELD} />
            <input value={d.sub} onChange={e => patch({ sub: e.target.value })} placeholder="Podtitulek" className={FIELD} />
          </>
        ) : (
          <>
            <input value={d.words.join(", ")} onChange={e => patch({ words: e.target.value.split(",").map(w => w.trim()) })}
              placeholder="Slova oddělená čárkou" className={FIELD} />
            <input value={d.subHeadline} onChange={e => patch({ subHeadline: e.target.value })} placeholder="Podtitulek" className={FIELD} />
          </>
        )}
        <input value={d.cta ?? ""} onChange={e => patch({ cta: e.target.value })} className={FIELD}
          placeholder={lang === "cs" ? "Výzva (výchozí: Odepiš rovnou na tuhle story)" : "CTA (default: Reply to this story)"} />

        <DraftPhotoList photos={d.photos} galleryPhotos={galleryPhotos} onChange={photos => patch({ photos })} />

        {/* akce */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
            className="bg-zinc-900 border border-white/20 px-2 py-1" />
          <button onClick={save} className="border border-white/20 px-3 py-1.5 hover:border-white/50">Uložit</button>
          <button onClick={downloadMp4} disabled={!canRender}
            className="border border-white/20 px-3 py-1.5 hover:border-white/50 disabled:opacity-30">
            ↓ MP4
          </button>
          <button onClick={approve} disabled={!publishAt || !canRender}
            className="bg-amber-500 text-black px-3 py-1.5 font-medium disabled:opacity-30">
            {exporting ? `Renderuji… ${Math.round(progress * 100)}%` : "Schválit + naplánovat"}
          </button>
          <button onClick={remove} className="text-gray-500 hover:text-red-400 ml-auto">Zamítnout</button>
        </div>
      </div>

      {/* skrytý full-res kontejner pro export */}
      <div ref={exportRef} style={{
        position: "fixed", top: "-9999px", left: "-9999px",
        width: W, height: H, pointerEvents: "none", overflow: "hidden",
      }}>
        <StoryTemplate {...templateProps} chrome={false} scale={1} exportTick={exportTick} exportLayer={exportLayer} />
      </div>
    </div>
  );
}
