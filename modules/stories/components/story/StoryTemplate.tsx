import type { StoryDraft } from "../../lib/types";
import { TemplateC } from "./TemplateC";
import { TemplateD } from "./TemplateD";
import type { ExportLayer } from "./useExport";
import type { Photo } from "./types";

export function StoryTemplate({ draft, photos, duration, paused, lang, chrome, scale, exportTick, exportLayer }: {
  draft: StoryDraft;
  photos: Photo[];
  duration: number;
  paused: boolean;
  lang: "cs" | "en";
  chrome: boolean;
  scale: number;
  exportTick?: number;
  exportLayer?: ExportLayer;
}) {
  const common = { photos, duration, paused, lang, chrome, cta: draft.cta ?? "", scale, exportTick, exportLayer };
  return draft.template === "C"
    ? <TemplateC {...common} headline={draft.headline} sub={draft.sub} />
    : <TemplateD {...common} words={draft.words.filter(Boolean)} subHeadline={draft.subHeadline} />;
}
