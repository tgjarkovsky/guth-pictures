"use client";

import { useRouter } from "next/navigation";
import { type GalleryRecord } from "@/modules/gallery/lib/gallery";
import { messageClass, useAdminAction } from "./useAdminAction";

interface Props {
  gallery: GalleryRecord;
  favoritesCount: number;
}

const buttonClass = "text-sm border border-white/20 px-4 py-2 hover:border-white/60 disabled:opacity-40 transition-colors";

export function GalleryActions({ gallery, favoritesCount }: Props) {
  const router = useRouter();
  const sync = useAdminAction();
  const tag = useAdminAction();
  const delivered = useAdminAction();
  const base = `/api/admin/gallery/${gallery.slug}`;

  const handleSync = () =>
    sync.run(`${base}/sync`, { method: "POST" }, {
      onSuccess: (data) => {
        router.refresh();
        return `Synchronizováno: ${data.synced} fotek${data.failed ? `, ${data.failed} selhalo` : ""}${data.errors?.length ? `\n${data.errors.join("\n")}` : ""}`;
      },
    });

  const handleTag = () =>
    tag.run(`${base}/tag`, { method: "POST" }, {
      onSuccess: (data) =>
        `Označeno v Lightroomu: ${data.tagged} fotek${data.failed ? `, ${data.failed} selhalo` : ""}`,
    });

  const handleToggleDelivered = () =>
    delivered.run(
      base,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivered: !gallery.delivered }),
      },
      { onSuccess: () => router.refresh() },
    );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={gallery.delivered ?? false}
            disabled={delivered.busy}
            onChange={handleToggleDelivered}
          />
          Doručeno klientovi
        </label>
        <button onClick={handleSync} disabled={sync.busy} className={buttonClass}>
          {sync.busy ? "Synchronizuji…" : "↻ Sync z Lightroomu"}
        </button>

        {favoritesCount ? (
          <button onClick={handleTag} disabled={tag.busy} className={buttonClass}>
            {tag.busy ? "Označuji…" : `★ Označit v Lightroomu (${favoritesCount})`}
          </button>
        ) : null}
      </div>

      {[sync.message, tag.message].map(
        (m, i) => m && (
          <p key={i} className={`text-sm ${messageClass(m)}`}>
            {m}
          </p>
        ),
      )}
    </>
  );
}
