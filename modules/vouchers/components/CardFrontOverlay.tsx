import localFont from "next/font/local";
import { CARD, CREAM } from "../lib/design";

const playfair = localFont({
  src: [
    { path: "../fonts/PlayfairDisplay-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/PlayfairDisplay-Italic.ttf", weight: "400", style: "italic" },
  ],
  display: "swap",
});
const syne = localFont({ src: "../fonts/Syne-ExtraBold.ttf", weight: "800", display: "swap" });

/** Card grid px → width of the box (the parent must set container-type: inline-size). */
const c = (n: number) => `${((n * 100) / CARD.w).toFixed(3)}cqw`;

/**
 * Text and shading of the card front (CardFront in lib/design.tsx) in plain HTML, laid over a photo
 * in the admin so the crop can be judged live. Keep in sync with CardFront.
 */
export function CardFrontOverlay({ locale = "cs" }: { locale?: "cs" | "en" }) {
  const t = locale === "cs" ? { title: "Dárkový poukaz", sub: "na portrétní focení" } : { title: "Gift voucher", sub: "for a portrait session" };
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ color: CREAM }}>
      <div className="absolute inset-x-0 bottom-0" style={{ height: c(420), backgroundImage: "linear-gradient(180deg, rgba(20,18,17,0) 0%, rgba(20,18,17,.55) 55%, rgba(20,18,17,.82) 100%)" }} />
      <div className="absolute inset-x-0 top-0" style={{ height: c(140), backgroundImage: "linear-gradient(180deg, rgba(20,18,17,.45) 0%, rgba(20,18,17,0) 100%)" }} />
      <div className={`absolute uppercase ${syne.className}`} style={{ left: c(44), top: c(40), fontSize: c(12), letterSpacing: c(2.6), fontWeight: 800, lineHeight: 1.2 }}>
        Guth Pictures
      </div>
      <div className={`absolute flex flex-col ${playfair.className}`} style={{ left: c(44), right: c(44), bottom: c(52) }}>
        <span style={{ fontWeight: 500, fontSize: c(64), lineHeight: 1, letterSpacing: c(-1) }}>{t.title}</span>
        <span style={{ fontStyle: "italic", fontWeight: 400, fontSize: c(25), lineHeight: 1.1, marginTop: c(10) }}>{t.sub}</span>
      </div>
    </div>
  );
}
