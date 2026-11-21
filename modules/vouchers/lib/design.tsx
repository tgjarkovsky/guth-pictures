/**
 * Gift voucher — an A6 two-sided card (105 × 148 mm), drawn on a 620 × 874 grid.
 * Rendered by satori (next/og), so only flexbox + inline styles are allowed.
 *
 * Front: the photo is the gift — logo and one line of type.
 * Back: who it is for comes first; the practical part is quiet at the bottom.
 */
export const CARD = { w: 620, h: 874 } as const;

export type VoucherTheme = "noir" | "riviera" | "ivy" | "snow";

/** Photo + accent per package. Photos live in modules/vouchers/photos/<theme>.jpg. */
export const THEMES: Record<VoucherTheme, { accent: string; position: string }> = {
  noir: { accent: "#C4574A", position: "center 30%" },
  riviera: { accent: "#4F7FE3", position: "center 35%" },
  ivy: { accent: "#7E9E68", position: "center 30%" },
  snow: { accent: "#C21E2B", position: "center 30%" },
};

export function themeForProduct(productId: string): VoucherTheme {
  if (/standard/.test(productId)) return "ivy";
  if (/rozsireny|extended/.test(productId)) return "riviera";
  if (/deluxe/.test(productId)) return "snow";
  return "noir";
}

export type CardProps = {
  locale: "cs" | "en";
  theme: VoucherTheme;
  photoSrc: string;             // data: URI
  qrSrc: string;                // data: URI of the booking QR code
  recipientName: string;
  dedication?: string;
  packageName: string;
  packageDetails: string[];
  code: string;
  validUntil: string;           // already formatted for the locale
  bookingUrlLabel: string;      // guthpictures.eu/poukaz
  scale?: number;
};

export const CREAM = "#F6F3EE";
export const INK = "#232120";
const MUTED = "#7B746D";

const copy = {
  cs: {
    title: "Dárkový poukaz",
    sub: "na fotografický zážitek",
    for: "Pro",
    book: "Termín si domluvíš přes QR kód",
    or: "nebo na",
    valid: "platí do",
  },
  en: {
    title: "Gift voucher",
    sub: "for a photo experience",
    for: "For",
    book: "Book your session via the QR code",
    or: "or at",
    valid: "valid until",
  },
} as const;

const f = (st: React.CSSProperties = {}): React.CSSProperties => ({ display: "flex", ...st });

export function CardFront(p: CardProps) {
  const u = (n: number) => n * (p.scale ?? 1);
  const t = copy[p.locale];
  const theme = THEMES[p.theme];
  return (
    <div style={f({ width: u(CARD.w), height: u(CARD.h), position: "relative", background: INK, overflow: "hidden" })}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.photoSrc}
        width={u(CARD.w)}
        height={u(CARD.h)}
        style={{ objectFit: "cover", objectPosition: theme.position, width: u(CARD.w), height: u(CARD.h) }}
        alt=""
      />
      <div style={f({ position: "absolute", left: 0, right: 0, bottom: 0, height: u(420), backgroundImage: "linear-gradient(180deg, rgba(20,18,17,0) 0%, rgba(20,18,17,.55) 55%, rgba(20,18,17,.82) 100%)" })} />
      <div style={f({ position: "absolute", left: 0, right: 0, top: 0, height: u(140), backgroundImage: "linear-gradient(180deg, rgba(20,18,17,.45) 0%, rgba(20,18,17,0) 100%)" })} />
      <div style={f({ position: "absolute", left: u(44), top: u(40), fontFamily: "Syne", fontWeight: 800, fontSize: u(12), letterSpacing: u(2.6), textTransform: "uppercase", color: CREAM })}>
        Guth Pictures
      </div>
      <div style={f({ position: "absolute", left: u(44), right: u(44), bottom: u(52), flexDirection: "column", color: CREAM })}>
        <span style={{ fontFamily: "Playfair", fontWeight: 500, fontSize: u(64), lineHeight: 1.0, letterSpacing: u(-1) }}>{t.title}</span>
        <div style={f({ marginTop: u(10), alignItems: "flex-end" })}>
          <span style={{ fontFamily: "Playfair", fontStyle: "italic", fontSize: u(25), lineHeight: 1.1 }}>{t.sub}</span>
          <div style={f({ width: u(7), height: u(7), background: theme.accent, marginLeft: u(4), marginBottom: u(5) })} />
        </div>
      </div>
    </div>
  );
}

export function CardBack(p: CardProps) {
  const u = (n: number) => n * (p.scale ?? 1);
  const t = copy[p.locale];
  const accent = THEMES[p.theme].accent;
  const long = p.recipientName.length > 22;
  return (
    <div style={f({ width: u(CARD.w), height: u(CARD.h), background: CREAM, color: INK, flexDirection: "column", padding: u(52) })}>
      <div style={f({ flex: 0.55 })} />
      <span style={{ fontFamily: "Epilogue", fontWeight: 600, fontSize: u(10), letterSpacing: u(2.6), textTransform: "uppercase", color: MUTED }}>{t.for}</span>
      <span style={{ fontFamily: "Playfair", fontWeight: 500, fontSize: u(long ? 36 : 46), lineHeight: 1.08, marginTop: u(8) }}>{p.recipientName}</span>
      {p.dedication && (
        <span style={{ fontFamily: "Playfair", fontStyle: "italic", fontSize: u(p.dedication.length > 110 ? 16 : 18), lineHeight: 1.5, color: MUTED, marginTop: u(18) }}>
          {p.dedication}
        </span>
      )}
      <div style={f({ width: u(32), height: u(2), background: accent, marginTop: u(36) })} />
      <span style={{ fontFamily: "Playfair", fontWeight: 500, fontSize: u(24), lineHeight: 1.2, marginTop: u(22) }}>{p.packageName}</span>
      <span style={{ fontFamily: "Epilogue", fontSize: u(13), lineHeight: 1.6, color: MUTED, marginTop: u(6) }}>{p.packageDetails.join(" · ")}</span>
      <div style={f({ flex: 1 })} />
      <div style={f({ alignItems: "center" })}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.qrSrc} width={u(92)} height={u(92)} alt="" />
        <div style={f({ flexDirection: "column", marginLeft: u(20), fontFamily: "Epilogue", fontSize: u(12.5), lineHeight: 1.55, color: INK })}>
          <span>{t.book}</span>
          <span>{`${t.or} ${p.bookingUrlLabel}`}</span>
        </div>
      </div>
      <div style={f({ marginTop: u(22), paddingTop: u(14), borderTop: `${u(1)}px solid rgba(35,33,32,.14)`, justifyContent: "space-between", fontFamily: "Epilogue", fontSize: u(10.5), letterSpacing: u(1), color: MUTED })}>
        <span>{p.code}</span>
        <span>{`${t.valid} ${p.validUntil}`}</span>
      </div>
    </div>
  );
}

/** One line of print instructions under the fold sheet (pdf-lib's standard fonts can't do Czech). */
export function PrintHint({ locale, scale = 1 }: { locale: "cs" | "en"; scale?: number }) {
  const u = (n: number) => n * scale;
  const text = locale === "cs"
    ? "Vytiskněte na A4 bez zmenšení (100 %), vystřihněte podle značek a přeložte v půlce. Nejlépe na pevnější papír."
    : "Print on A4 at 100 % (no scaling), cut along the marks and fold in half. Heavier paper works best.";
  return (
    <div style={f({ width: u(HINT.w), height: u(HINT.h), alignItems: "center", background: "#ffffff", fontFamily: "Epilogue", fontSize: u(11), color: "#8a8580" })}>
      {text}
    </div>
  );
}
export const HINT = { w: 1240, h: 30 } as const;
