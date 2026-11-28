"use client";

import { useRef, useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft } from "../lib/types";
import { DraftPhotoList } from "./DraftPhotoList";
import { StoryTemplate } from "./story/StoryTemplate";
import { useStoryExport } from "./story/useStoryExport";
import { FORMAT_SIZE, voucherSlideCount } from "./story/TemplateP";
import { VOUCHER_PRESETS } from "./story/voucherPresets";
import type { Photo } from "./story/types";

const PREVIEW_H = 420;
const FIELD = "w-full bg-zinc-900 border border-white/20 px-2 py-1";
const SELECT = "bg-zinc-900 border border-white/20 px-2 py-1";

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
  const [saveState, setSaveState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; msg?: string }>({ kind: "idle" });
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const exportRef = useRef<HTMLDivElement>(null);

  const duration = d.durationMs ?? 2400;
  const lang = d.lang ?? "cs";
  const isVoucher = d.template === "P";
  const { w: W, h: H } = FORMAT_SIZE[isVoucher ? d.format ?? "story" : "story"];
  const PREVIEW_SCALE = PREVIEW_H / 1920; // stejná šířka náhledu pro 9:16 i 4:5
  const photos: Photo[] = d.photos.map(p => ({
    url: cloudinaryUrl(p.publicId, `w_${W},h_${H},c_fill,q_auto,f_jpg`),
    x: p.x, y: p.y,
  }));
  // story: IG překrývá horních a spodních ~250 px; feed reklama nic
  const safeBand = H === 1920 ? { position: "absolute", left: 0, right: 0, height: 250 * PREVIEW_SCALE, background: "rgba(255,60,60,0.22)" } as const : null;

  const slideCount = isVoucher
    ? voucherSlideCount(d.photos.length)
    : Math.max(d.template === "C" ? d.photos.length : d.words.filter(Boolean).length, 1);
  const { exporting, progress, exportTick, exportLayer, canRender, downloadMp4, approve } =
    useStoryExport(d, { publishAt, onChanged, exportRef, slideCount, duration });

  const templateProps = { draft: d, photos, duration, paused, lang } as const;
  function patch(p: Partial<StoryDraft>) {
    setD(prev => ({ ...prev, ...p }));
    setSaveState(s => (s.kind === "saved" ? { kind: "idle" } : s));
  }

  async function save() {
    clearTimeout(savedTimer.current);
    setSaveState({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/stories/drafts", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: d }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSaveState({ kind: "saved" });
      savedTimer.current = setTimeout(() => setSaveState({ kind: "idle" }), 3000);
      await onChanged();
    } catch (err) {
      setSaveState({ kind: "error", msg: err instanceof Error ? err.message : String(err) });
    }
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
          {showSafeZone && safeBand && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
              <div style={{ ...safeBand, top: 0, borderBottom: "1px solid rgba(255,80,80,0.7)" }} />
              <div style={{ ...safeBand, bottom: 0, borderTop: "1px solid rgba(255,80,80,0.7)" }} />
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
          <select value={d.template} onChange={e => patch({ template: e.target.value as StoryDraft["template"] })}
            className={SELECT}>
            <option value="C">Šablona C</option>
            <option value="D">Šablona D</option>
            <option value="P">Šablona P (poukaz)</option>
          </select>
          <select value={lang} onChange={e => patch({ lang: e.target.value as "cs" | "en" })}
            className={SELECT}>
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

        {isVoucher ? (
          <>
            <div className="flex items-center gap-3">
              <select value={d.format ?? "story"} onChange={e => patch({ format: e.target.value as "story" | "feed" })} className={SELECT}>
                <option value="story">Story / Reels 9:16</option>
                <option value="feed">Feed 4:5</option>
              </select>
              <select value={d.voucherTheme ?? "snow"} onChange={e => patch({ voucherTheme: e.target.value as NonNullable<StoryDraft["voucherTheme"]> })} className={SELECT}>
                <option value="snow">Karta: Sníh</option>
                <option value="noir">Karta: Noir</option>
                <option value="riviera">Karta: Riviéra</option>
                <option value="ivy">Karta: Břečťan</option>
              </select>
              <select value="" onChange={e => {
                const preset = VOUCHER_PRESETS[lang][+e.target.value];
                if (preset) patch({ kicker: preset.kicker, headline: preset.headline, sub: preset.sub });
              }} className={SELECT}>
                <option value="">Text podle předlohy…</option>
                {VOUCHER_PRESETS[lang].map((p, i) => <option key={i} value={i}>{p.name}</option>)}
              </select>
            </div>
            <input value={d.kicker ?? ""} onChange={e => patch({ kicker: e.target.value })} placeholder="Nadpis nad headline (Vánoční dárek)" className={FIELD} />
            <textarea value={d.headline} onChange={e => patch({ headline: e.target.value })}
              placeholder="Headline" rows={3} className={FIELD} />
            <input value={d.sub} onChange={e => patch({ sub: e.target.value })} placeholder="Podtitulek" className={FIELD} />
            <input value={d.price ?? ""} onChange={e => patch({ price: e.target.value })} placeholder="Cena na kartě (od 2 900 Kč)" className={FIELD} />
          </>
        ) : d.template === "C" ? (
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
          placeholder={isVoucher
            ? (lang === "cs" ? "Odkaz pod kartou (výchozí: guthpictures.eu/darkovy-poukaz)" : "Link under the card (default: guthpictures.eu/en/darkovy-poukaz)")
            : (lang === "cs" ? "Výzva (výchozí: Odepiš rovnou na tuhle story)" : "CTA (default: Reply to this story)")} />

        <DraftPhotoList photos={d.photos} galleryPhotos={galleryPhotos} onChange={photos => patch({ photos })} />

        {/* akce */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
            className="bg-zinc-900 border border-white/20 px-2 py-1" />
          <button onClick={save} disabled={saveState.kind === "saving"}
            className="border border-white/20 px-3 py-1.5 hover:border-white/50 disabled:opacity-50">
            {saveState.kind === "saving" ? "Ukládám…" : "Uložit"}
          </button>
          {saveState.kind === "saved" && <span role="status" className="text-xs text-green-400">Uloženo ✓</span>}
          {saveState.kind === "error" && <span role="alert" className="text-xs text-red-400">Uložení selhalo: {saveState.msg}</span>}
          <button onClick={downloadMp4} disabled={!canRender}
            className="border border-white/20 px-3 py-1.5 hover:border-white/50 disabled:opacity-30">
            ↓ MP4
          </button>
          <button onClick={approve} disabled={!publishAt || !canRender || H !== 1920}
            title={H !== 1920 ? "Feed 4:5 nejde publikovat jako story, stáhni MP4 do reklamy" : undefined}
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
