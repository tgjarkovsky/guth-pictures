"use client";

/**
 * Pásy, které na Instagramu překrývá rozhraní (v px plátna 1080×1920).
 * - story: horní lišta s profilem a spodní pole „Odeslat zprávu“
 * - reels: nahoře nadpis „Reels“ a kamera, dole jméno, popisek a zvuk, vpravo ikony (srdce, komentáře, sdílení)
 * - reelsAd: doporučení Meta pro reklamy v Reels (14 % nahoře, 35 % dole, 6 % po stranách)
 */
export const SAFE_ZONES = {
  story: { label: "Story", top: 250, bottom: 250, left: 0, right: 0 },
  reels: { label: "Reels", top: 220, bottom: 420, left: 40, right: 140 },
  reelsAd: { label: "Reels reklama", top: 270, bottom: 670, left: 65, right: 65 },
} as const;

export type SafeZoneKind = keyof typeof SAFE_ZONES;

const BAND = "rgba(255,60,60,0.22)";
const LINE = "1px solid rgba(255,80,80,0.7)";

export function SafeZoneOverlay({ kind, scale }: { kind: SafeZoneKind; scale: number }) {
  const z = SAFE_ZONES[kind];
  const top = z.top * scale, bottom = z.bottom * scale;
  const side = { position: "absolute", top, bottom, background: BAND } as const;
  return (
    <div data-testid={`safe-zone-${kind}`} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: top, background: BAND, borderBottom: LINE }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bottom, background: BAND, borderTop: LINE }} />
      {z.left > 0 && <div style={{ ...side, left: 0, width: z.left * scale, borderRight: LINE }} />}
      {z.right > 0 && <div style={{ ...side, right: 0, width: z.right * scale, borderLeft: LINE }} />}
    </div>
  );
}
