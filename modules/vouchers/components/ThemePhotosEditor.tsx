"use client";

import { useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import { CARD, THEME_CHOICES, type VoucherTheme } from "../lib/design";
import type { ThemePhoto, VoucherSettings } from "../lib/types";
import { CardFrontOverlay } from "./CardFrontOverlay";

type Value = VoucherSettings["themePhotos"];

/**
 * Admin → Poukazy → Nastavení: which portfolio photo goes on each card design.
 * The same photo is used in the PDF, on the order page and in the voucher ads (stories, template P).
 */
/** The real rendered card front for the current (possibly unsaved) choice. */
const cardPreviewUrl = (theme: VoucherTheme, photo?: ThemePhoto) => {
  const q = new URLSearchParams(photo ? { theme, publicId: photo.publicId, x: String(photo.x), y: String(photo.y) } : { theme });
  return `/api/admin/vouchers/card?${q}`;
};

export function ThemePhotosEditor({ value, onChange, galleryPhotos, savedAt }: {
  value: Value;
  onChange: (v: Value) => void;
  galleryPhotos: GalleryPhoto[];
  savedAt: number; // bumps the rendered preview after a save
}) {
  const [pickerFor, setPickerFor] = useState<VoucherTheme | null>(null);

  function set(theme: VoucherTheme, photo: ThemePhoto | null) {
    const next = { ...value };
    if (photo) next[theme] = photo;
    else delete next[theme];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Fotky na kartách</h2>
      <p className="text-gray-400">
        Fotka na přední straně poukazu pro každý vzhled. Bere se z portfolia v plném rozlišení, takže je ostrá i v tisku.
        Stejná fotka je v náhledech na webu a v reklamách na poukaz ve stories. Změna se projeví po uložení (na webu do 10 minut).
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {THEME_CHOICES.map(({ id, name }) => {
          const photo = value[id];
          return (
            <div key={id} className="border border-white/10 p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{name.cs}</span>
                <span className="text-xs text-gray-500">{photo ? "z portfolia" : "původní fotka"}</span>
              </div>
              <div className="relative bg-black overflow-hidden" style={{ aspectRatio: `${CARD.w} / ${CARD.h}`, containerType: "inline-size" }}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cloudinaryUrl(photo.publicId, "c_limit,w_500,q_auto,f_auto")} alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: `${photo.x}% ${photo.y}%` }} />
                ) : null}
                {photo ? <CardFrontOverlay /> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/vouchers/design/${id}?v=${savedAt}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              {photo && (
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 text-xs text-gray-400">
                  <label title="Výřez vodorovně">x</label>
                  <input type="range" min={0} max={100} value={photo.x} onChange={(e) => set(id, { ...photo, x: +e.target.value })} />
                  <label title="Výřez svisle">y</label>
                  <input type="range" min={0} max={100} value={photo.y} onChange={(e) => set(id, { ...photo, y: +e.target.value })} />
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <button type="button" disabled={galleryPhotos.length === 0}
                  onClick={() => setPickerFor(pickerFor === id ? null : id)}
                  className="border border-white/20 px-2 py-1 hover:border-white/50 disabled:opacity-40">
                  {photo ? "Změnit fotku" : "Vybrat z portfolia"}
                </button>
                {photo && (
                  <button type="button" onClick={() => set(id, null)} className="text-gray-500 hover:text-red-400">Vrátit původní</button>
                )}
                <a href={cardPreviewUrl(id, photo)} target="_blank" className="underline text-gray-400 ml-auto"
                  title="Skutečná vykreslená karta s touhle fotkou a výřezem (i neuložené)">Karta</a>
              </div>
            </div>
          );
        })}
      </div>
      {pickerFor && (
        <div className="border border-white/20 p-2">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Fotka pro vzhled „{THEME_CHOICES.find((c) => c.id === pickerFor)?.name.cs}“ (portfolio)</span>
            <button type="button" onClick={() => setPickerFor(null)}>Zavřít ✕</button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-72 overflow-y-auto">
            {galleryPhotos.map((g) => (
              <button key={g.publicId} type="button" title={g.publicId}
                onClick={() => { set(pickerFor, { publicId: g.publicId, x: 50, y: 30 }); setPickerFor(null); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cloudinaryUrl(g.publicId, "w_120,h_170,c_fill,q_auto,f_auto")} alt="" className="w-[60px] h-[85px] object-cover hover:opacity-70" />
              </button>
            ))}
          </div>
        </div>
      )}
      {galleryPhotos.length === 0 && <p className="text-amber-300 text-xs">Portfolio se nenačetlo, fotky teď nejde vybrat.</p>}
    </div>
  );
}
