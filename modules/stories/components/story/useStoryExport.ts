import { useCallback, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import { signedUploadRequest } from "@/lib/cloudinary-signed-upload";
import type { StoryDraft } from "../../lib/types";
import { useExport, type ExportLayer } from "./useExport";
import { FORMAT_SIZE, cardSlideMs } from "./TemplateP";

const errMsg = (err: unknown) => (err instanceof Error ? err.message : err);

export function useStoryExport(draft: StoryDraft, { publishAt, onChanged, exportRef, slideCount, duration }: {
  publishAt: string;
  onChanged: () => Promise<void>;
  exportRef: RefObject<HTMLDivElement | null>;
  slideCount: number;
  duration: number;
}) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportTick, setExportTick] = useState<number | undefined>(undefined);
  const [exportLayer, setExportLayer] = useState<ExportLayer | undefined>(undefined);
  const { exportVideo } = useExport();
  const size = FORMAT_SIZE[draft.template === "P" ? draft.format ?? "story" : "story"];

  const canRender = draft.photos.length > 0 && !exporting
    && !(draft.template === "D" && draft.words.filter(Boolean).length === 0);

  const onLayerReady = useCallback(async (slideIndex: number, layer: ExportLayer) => {
    flushSync(() => { setExportTick(slideIndex); setExportLayer(layer); });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, []);

  async function renderVideo(): Promise<Blob> {
    try {
      return await exportVideo({
        element: exportRef.current!,
        width: size.w,
        height: size.h,
        slideCount,
        slideDurationMs: duration,
        // šablona P: poslední snímek je karta poukazu a drží déle
        slideDurationsMs: draft.template === "P"
          ? Array.from({ length: slideCount }, (_, i) => (i === slideCount - 1 ? cardSlideMs(duration) : duration))
          : undefined,
        hasWordLayer: draft.template !== "C",
        onProgress: setProgress,
        onLayerReady,
      });
    } finally {
      setExportTick(undefined);
      setExportLayer(undefined);
    }
  }

  async function withExport(fn: () => Promise<void>, failure: string) {
    setExporting(true);
    try {
      await fn();
    } catch (err) {
      alert(`${failure}: ${errMsg(err)}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setExportTick(undefined);
    }
  }

  async function downloadMp4() {
    if (!canRender) return;
    await withExport(async () => {
      const blob = await renderVideo();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${draft.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    }, "Export selhal");
  }

  async function approve() {
    if (!publishAt || !canRender) return;
    await withExport(async () => {
      // 1. render videa v prohlížeči
      const blob = await renderVideo();

      // 2. signed direct upload do Cloudinary (video)
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const { url, body } = signedUploadRequest(blob, sig, { resourceType: "video", filename: `story-${draft.id}.mp4` });
      const uploaded = await fetch(url, { method: "POST", body }).then(r => r.json());
      if (!uploaded.public_id) throw new Error(uploaded.error?.message ?? "Upload failed");

      // 3. přesun do fronty
      const res = await fetch("/api/admin/stories/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          videoPublicId: uploaded.public_id,
          publishAt: new Date(publishAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await onChanged();
    }, "Schválení selhalo");
  }

  return { exporting, progress, exportTick, exportLayer, canRender, renderVideo, downloadMp4, approve };
}
