"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type GalleryRecord, type GalleryPhoto, type GallerySelection } from "@/modules/gallery/lib/gallery";
import {
  selectedFilenames,
  formatFilenamesForCopy,
  formatFilenamesForTxt,
} from "@/modules/gallery/lib/selection-export";
import { CLOUD, watermarkedUrl } from "./galleryImage";
import { errorMessage, messageClass, useAdminAction } from "./useAdminAction";

interface Props {
  gallery: GalleryRecord;
  photos: GalleryPhoto[];
  selection: GallerySelection;
}

export function ClientSelectionPanel({ gallery, photos, selection }: Props) {
  const router = useRouter();
  const [copyResult, setCopyResult] = useState<string | null>(null);
  const unlock = useAdminAction();

  async function handleCopyFilenames() {
    try {
      await navigator.clipboard.writeText(formatFilenamesForCopy(photos, selection.favorites));
      setCopyResult(`Zkopírováno ${selectedFilenames(photos, selection.favorites).length} názvů`);
    } catch (e) {
      setCopyResult(errorMessage(e));
    }
  }

  function handleDownloadTxt() {
    const blob = new Blob([formatFilenamesForTxt(photos, selection.favorites)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${gallery.slug}-vyber.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleUnlock = () =>
    unlock.run(`/api/admin/gallery/${gallery.slug}/unlock`, { method: "POST" }, {
      fallbackError: "Unlock failed",
      onSuccess: () => router.refresh(),
      onError: setCopyResult,
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">
          Výběr klienta ({selection.favorites.length}
          {gallery.maxSelection !== undefined ? ` / ${gallery.maxSelection}` : ""} fotek)
        </h2>
        <p className="text-xs text-gray-500">
          Naposledy upraveno {new Date(selection.lastUpdated).toLocaleString("cs-CZ")}
        </p>
      </div>
      {selection.confirmedAt && (
        <div className="flex items-center justify-between border border-sky-500/30 px-4 py-2">
          <p className="text-sm text-sky-400">
            Potvrzeno klientem · {new Date(selection.confirmedAt).toLocaleString("cs-CZ")}
          </p>
          <button
            onClick={handleUnlock}
            disabled={unlock.busy}
            className="text-xs border border-white/20 px-3 py-1.5 hover:border-white/60 disabled:opacity-40 transition-colors"
          >
            {unlock.busy ? "Odemykám…" : "Odemknout"}
          </button>
        </div>
      )}
      {selection.note && (
        <div className="border border-white/10 p-4">
          <p className="text-xs text-gray-500 mb-1">Poznámka klienta</p>
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{selection.note}</p>
        </div>
      )}
      {selection.favorites.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyFilenames}
            className="text-sm border border-white/20 px-4 py-2 hover:border-white/60 transition-colors"
          >
            Zkopírovat názvy souborů
          </button>
          <button
            onClick={handleDownloadTxt}
            className="text-sm border border-white/20 px-4 py-2 hover:border-white/60 transition-colors"
          >
            Stáhnout .txt
          </button>
          {copyResult && <p className={`text-sm ${messageClass(copyResult)}`}>{copyResult}</p>}
        </div>
      )}
      {selection.favorites.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos
            .filter((p) => selection.favorites.includes(p.lrId))
            .map((photo) => (
              <div key={photo.lrId} className="relative aspect-square bg-zinc-900 overflow-hidden">
                <Image
                  src={watermarkedUrl(photo.cloudinaryId, CLOUD)}
                  alt={photo.filename}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                <div className="absolute inset-0 ring-2 ring-white/80 pointer-events-none" />
              </div>
            ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Klient zatím nic nevybral.</p>
      )}
    </div>
  );
}
