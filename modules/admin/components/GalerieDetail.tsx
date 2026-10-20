"use client";

import { useRouter } from "next/navigation";
import { type GalleryRecord, type GalleryPhoto, type GallerySelection } from "@/modules/gallery/lib/gallery";
import { AllPhotosGrid } from "./AllPhotosGrid";
import { ClientSelectionPanel } from "./ClientSelectionPanel";
import { GalleryActions } from "./GalleryActions";
import { useAdminAction } from "./useAdminAction";

interface Props {
  gallery: GalleryRecord;
  photos: GalleryPhoto[];
  selection: GallerySelection | null;
}

export function GalerieDetail({ gallery, photos, selection }: Props) {
  const router = useRouter();
  const del = useAdminAction();

  const expired = new Date() > new Date(gallery.expiresAt);
  const galleryUrl = `/gallery/${gallery.slug}`;

  function handleDelete() {
    if (!confirm(`Smazat galerii "${gallery.slug}"? Tato akce je nevratná.`)) return;
    return del.run(`/api/admin/gallery/${gallery.slug}`, { method: "DELETE" }, {
      fallbackError: "Delete failed",
      onSuccess: () => router.push("/admin/galerie"),
      onError: () => {},
      keepBusyOnSuccess: true,
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{gallery.slug}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {expired ? (
              <span className="text-red-400">Expirováno</span>
            ) : (
              <>Aktivní · vyprší {new Date(gallery.expiresAt).toLocaleDateString("cs-CZ")}</>
            )}
            {gallery.syncedAt && (
              <> · sync {new Date(gallery.syncedAt).toLocaleDateString("cs-CZ")}</>
            )}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={del.busy}
          className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 hover:border-red-400 transition-colors disabled:opacity-40"
        >
          {del.busy ? "Mažu…" : "Smazat"}
        </button>
      </div>

      {/* Info + actions */}
      <div className="border border-white/10 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Odkaz pro klienta</p>
            <a
              href={galleryUrl}
              target="_blank"
              rel="noopener"
              className="text-white hover:underline break-all"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}{galleryUrl}
            </a>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Fotky</p>
            <p>{gallery.photoCount} synchronizováno</p>
          </div>
        </div>
        <GalleryActions gallery={gallery} favoritesCount={selection?.favorites.length ?? 0} />
      </div>

      {selection ? (
        <ClientSelectionPanel gallery={gallery} photos={photos} selection={selection} />
      ) : (
        <p className="text-sm text-gray-500">Klient ještě neodeslal výběr.</p>
      )}

      {photos.length > 0 && <AllPhotosGrid photos={photos} favorites={selection?.favorites} />}
    </div>
  );
}
