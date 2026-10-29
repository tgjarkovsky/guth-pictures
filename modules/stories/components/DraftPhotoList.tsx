"use client";

import { useRef, useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import { signedUploadRequest } from "@/lib/cloudinary-signed-upload";
import type { DraftPhoto } from "../lib/types";

const MAX_PHOTOS = 10;

export function DraftPhotoList({ photos, galleryPhotos, onChange }: {
  photos: DraftPhoto[];
  galleryPhotos: GalleryPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerFor, setPickerFor] = useState<number | "add" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (i: number, p: Partial<DraftPhoto>) =>
    onChange(photos.map((pp, j) => j === i ? { ...pp, ...p } : pp));

  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function pickPhoto(publicId: string) {
    if (pickerFor === "add") onChange([...photos, { publicId, x: 50, y: 50 }]);
    else if (typeof pickerFor === "number") update(pickerFor, { publicId });
    setPickerFor(null);
  }

  async function uploadFromDisk(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const uploadedIds: string[] = [];
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
        const { url, body } = signedUploadRequest(file, sig, { resourceType: "image" });
        const res = await fetch(url, { method: "POST", body }).then(r => r.json());
        if (!res.public_id) throw new Error(res.error?.message ?? "Upload failed");
        uploadedIds.push(res.public_id);
      }
      onChange([...photos, ...uploadedIds.map(publicId => ({ publicId, x: 50, y: 50 }))]);
    } catch (err) {
      alert(`Nahrání selhalo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {photos.map((p, i) => (
        <div key={`${p.publicId}-${i}`} className="flex items-center gap-2">
          <div className="flex flex-col">
            <button className="text-xs text-gray-500 hover:text-white disabled:opacity-30 leading-none"
              disabled={i === 0} title="Posunout výš" onClick={() => movePhoto(i, -1)}>↑</button>
            <button className="text-xs text-gray-500 hover:text-white disabled:opacity-30 leading-none"
              disabled={i === photos.length - 1} title="Posunout níž" onClick={() => movePhoto(i, 1)}>↓</button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cloudinaryUrl(p.publicId, "w_64,h_64,c_fill,q_auto,f_auto")} alt="" className="w-8 h-8 object-cover" />
          <button
            className="text-xs text-left flex-1 truncate border border-white/20 px-1 py-0.5 hover:border-white/50"
            title="Vybrat jinou fotku z portfolia"
            onClick={() => setPickerFor(pickerFor === i ? null : i)}>
            {p.publicId.split("/").pop()}
          </button>
          <label className="text-xs text-gray-500" title="Výřez vodorovně: 0 = levý okraj fotky, 100 = pravý">x</label>
          <input type="range" min={0} max={100} value={p.x} className="w-16"
            title="Výřez vodorovně: 0 = levý okraj fotky, 100 = pravý"
            onChange={e => update(i, { x: +e.target.value })} />
          <label className="text-xs text-gray-500" title="Výřez svisle: 0 = horní okraj fotky, 100 = dolní">y</label>
          <input type="range" min={0} max={100} value={p.y} className="w-16"
            title="Výřez svisle: 0 = horní okraj fotky, 100 = dolní"
            onChange={e => update(i, { y: +e.target.value })} />
          <button className="text-xs text-gray-500 hover:text-red-400"
            onClick={() => onChange(photos.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {photos.length < MAX_PHOTOS && (
        <div className="flex gap-2">
          <button className="text-xs border border-white/20 px-2 py-1"
            disabled={galleryPhotos.length === 0}
            onClick={() => setPickerFor(pickerFor === "add" ? null : "add")}>
            + z portfolia
          </button>
          <button className="text-xs border border-white/20 px-2 py-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}>
            {uploading ? "Nahrávám…" : "+ z disku"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => uploadFromDisk(e.target.files)} />
        </div>
      )}
      {pickerFor !== null && (
        <div className="flex flex-wrap gap-1 border border-white/20 p-2 max-h-64 overflow-y-auto">
          {galleryPhotos.map(g => (
            <button key={g.publicId} title={g.publicId} onClick={() => pickPhoto(g.publicId)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloudinaryUrl(g.publicId, "w_120,h_120,c_fill,q_auto,f_auto")} alt=""
                className="w-16 h-16 object-cover hover:opacity-70" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
