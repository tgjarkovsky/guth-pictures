/** C = headline, D = slova, P = reklama na dárkový poukaz. */
export type StoryTemplate = "C" | "D" | "P";

/** story = 1080×1920 (stories, reels), feed = 1080×1350 (reklama do feedu). */
export type StoryFormat = "story" | "feed";

export type StoryTextEntry = {
  id: string;
  template: StoryTemplate;
  headline?: string;    // C
  sub?: string;         // C
  words?: string[];     // D
  subHeadline?: string; // D
  source: "manual" | "ai";
  approved: boolean;
};

export type DraftPhoto = { publicId: string; x: number; y: number };

export type StoryDraft = {
  id: string;
  template: StoryTemplate;
  photos: DraftPhoto[];
  headline: string;
  sub: string;
  words: string[];
  subHeadline: string;
  textSource: "manual" | "ai";
  createdAt: string; // ISO
  durationMs?: number;   // délka slidu, default 2400
  lang?: "cs" | "en";    // default cs
  cta?: string;          // text CTA tlačítka, default dle jazyka
  // jen šablona P (poukaz)
  kicker?: string;       // malý nadpis nad headline, např. „Vánoční dárek“
  price?: string;        // cena na závěrečném snímku, např. „od 2 900 Kč“
  voucherTheme?: "snow" | "noir" | "riviera" | "ivy"; // vzhled karty poukazu
  format?: StoryFormat;  // default story
};

export type QueueItem = {
  id: string;
  template: StoryTemplate;
  videoPublicId: string;
  publishAt: string; // ISO
  status: "queued" | "published" | "failed";
  error?: string;
  draft?: StoryDraft; // návrh, ze kterého video vzniklo — kvůli „Vrátit do návrhů“ (starší položky ho nemají)
};

export type UsedPhoto = { publicId: string; usedAt: string };
