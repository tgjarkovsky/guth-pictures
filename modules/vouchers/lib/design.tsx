import { defaultColors as P } from "@/lib/theme-presets";

/**
 * Voucher artwork — A5 landscape. Rendered by satori (next/og) into a PNG that
 * is then placed on a PDF page, so only flexbox + inline styles are allowed.
 * Every size goes through `u()`, the design is drawn on a 1240 × 874 grid.
 */
export const VOUCHER_GRID = { width: 1240, height: 874 } as const;

export type VoucherArtProps = {
  locale: "cs" | "en";
  packageName: string;          // "Kreativní portrét — Rozšířený"
  packageDetails: string[];     // ["2–4 hod", "15 upravených fotek", "online galerie"]
  recipientName: string;
  dedication?: string;
  code: string;                 // GP-7KQ4-M2XD
  validUntil: string;           // already formatted for the locale
  photoSrc: string;             // URL or data: URI
  qrSrc: string;                // data: URI of the reservation QR code
  bookingUrlLabel: string;      // guthpictures.eu/poukaz
  christmas?: boolean;
  scale?: number;
};

const copy = {
  cs: {
    kicker: "Dárkový poukaz",
    headline: ["Portrét,", "který zůstane."],
    for: "pro",
    code: "Kód poukazu",
    valid: "Platí do",
    booking: "Termín si rezervuj na",
    season: "Krásné Vánoce",
  },
  en: {
    kicker: "Gift voucher",
    headline: ["A portrait", "that stays."],
    for: "for",
    code: "Voucher code",
    valid: "Valid until",
    booking: "Book your session at",
    season: "Merry Christmas",
  },
} as const;

// Fixed snow pattern so every voucher looks the same.
const SNOW: [number, number, number][] = [
  [62, 70, 3], [180, 40, 2], [300, 120, 4], [420, 60, 2], [120, 210, 2],
  [380, 260, 3], [70, 390, 2], [250, 330, 2], [460, 420, 3], [150, 520, 4],
  [340, 560, 2], [60, 660, 3], [230, 720, 2], [420, 690, 3], [480, 180, 2],
  [30, 800, 2], [300, 820, 3], [500, 560, 2],
];

export function VoucherArt(props: VoucherArtProps) {
  const s = props.scale ?? 1;
  const u = (n: number) => n * s;
  const t = copy[props.locale];
  const copper = P.accentSecondary;
  const photoW = 470;

  return (
    <div
      style={{
        width: u(VOUCHER_GRID.width),
        height: u(VOUCHER_GRID.height),
        display: "flex",
        background: P.bg,
        color: P.text,
        fontFamily: "Epilogue",
      }}
    >
      {/* Photo column */}
      <div style={{ width: u(photoW), height: "100%", display: "flex", position: "relative", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={props.photoSrc}
          width={u(photoW)}
          height={u(VOUCHER_GRID.height)}
          style={{ objectFit: "cover", width: u(photoW), height: u(VOUCHER_GRID.height) }}
          alt=""
        />
        {props.christmas &&
          SNOW.map(([x, y, r], i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: u(x), top: u(y), width: u(r * 2), height: u(r * 2),
                borderRadius: u(r), background: "rgba(250,240,228,0.75)",
              }}
            />
          ))}
      </div>

      {/* Text column */}
      <div
        style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: `${u(64)}px ${u(72)}px ${u(56)}px ${u(64)}px`, position: "relative",
        }}
      >
        {/* Frame line */}
        <div
          style={{
            position: "absolute", top: u(28), right: u(28), bottom: u(28), left: u(16), display: "flex",
            border: `${u(1.5)}px solid ${copper}`, opacity: 0.55,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontFamily: "DM Mono", fontSize: u(15), letterSpacing: u(4), textTransform: "uppercase", color: copper }}>
              Guth Pictures · {t.kicker}
            </div>
            {props.christmas && (
              <div style={{ display: "flex", alignItems: "center", fontFamily: "DM Mono", fontSize: u(15), letterSpacing: u(4), textTransform: "uppercase", color: P.textMuted }}>
                <div style={{ display: "flex", width: u(8), height: u(8), background: copper, transform: "rotate(45deg)", marginRight: u(12) }} />
                {t.season}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: u(44), fontFamily: "Syne", fontWeight: 700, fontSize: u(76), lineHeight: 1.0, letterSpacing: u(-1.5) }}>
            <span>{t.headline[0]}</span>
            <span>{t.headline[1]}</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", marginTop: u(40), fontSize: u(30) }}>
            <span style={{ color: P.textMuted, marginRight: u(12) }}>{t.for}</span>
            <span style={{ fontWeight: 600 }}>{props.recipientName}</span>
          </div>

          {props.dedication && (
            <div style={{ display: "flex", marginTop: u(18), fontStyle: "italic", fontSize: u(21), lineHeight: 1.45, color: P.textMuted, maxWidth: u(620) }}>
              „{props.dedication}“
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", borderTop: `${u(1)}px solid rgba(237,226,217,0.18)`, paddingTop: u(22) }}>
            <div style={{ display: "flex", fontSize: u(25), fontWeight: 600 }}>{props.packageName}</div>
            <div style={{ display: "flex", marginTop: u(8), fontSize: u(18), color: P.textMuted }}>
              {props.packageDetails.join("  ·  ")}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: u(30) }}>
            <div style={{ display: "flex", gap: u(44) }}>
              <Field label={t.code} value={props.code} u={u} mono />
              <Field label={t.valid} value={props.validUntil} u={u} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: u(16) }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: u(14), color: P.textGhost }}>{t.booking}</span>
                <span style={{ fontSize: u(17), color: P.text }}>{props.bookingUrlLabel}</span>
              </div>
              <div style={{ display: "flex", padding: u(6), background: P.accent, borderRadius: u(4) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={props.qrSrc} width={u(92)} height={u(92)} alt="" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, u, mono }: { label: string; value: string; u: (n: number) => number; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: "DM Mono", fontSize: u(12), letterSpacing: u(3), textTransform: "uppercase", color: P.textGhost }}>
        {label}
      </span>
      <span style={{ marginTop: u(6), fontSize: u(22), fontFamily: mono ? "DM Mono" : "Epilogue", color: P.accent, letterSpacing: mono ? u(1.5) : 0 }}>
        {value}
      </span>
    </div>
  );
}
