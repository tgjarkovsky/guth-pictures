import { C, ogSize, toolCardImage } from "@/lib/og-tool-card";

export const runtime = "edge";
export const alt = "Focení 101 — Guth Pictures";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cs = locale !== "en";
  const legs = cs
    ? { ap: "CLONA", sh: "ČAS", iso: "ISO" }
    : { ap: "APERTURE", sh: "SHUTTER", iso: "ISO" };

  return toolCardImage({
    title: cs ? ["Focení", "101"] : ["Photo", "101"],
    subtitle: cs
      ? ["Interaktivní průvodce tím,", "co dělá fotku"]
      : ["An interactive guide to", "what makes a photo"],
    tags: cs
      ? ["Clona", "Čas", "ISO", "Kompozice"]
      : ["Aperture", "Shutter", "ISO", "Composition"],
    diagram: (
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Triangle edges: apex (0,-130), bottom-left (-120,90), bottom-right (120,90) */}
        <Line x1={0} y1={-130} x2={-120} y2={90} color={C.accent} opacity={0.45} />
        <Line x1={0} y1={-130} x2={120} y2={90} color={C.accent} opacity={0.45} />
        <Line x1={-120} y1={90} x2={120} y2={90} color={C.accent} opacity={0.45} />

        <Node x={0} y={-130} color={C.accent} label={legs.ap} labelDy={-46} />
        <Node x={-120} y={90} color={C.muted} label={legs.sh} labelDy={34} />
        <Node x={120} y={90} color="#7BA7BC" label={legs.iso} labelDy={34} />

        {/* Centre: balanced-exposure readout */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: "translateY(14px)",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: C.text,
              letterSpacing: -1,
            }}
          >
            0.0 EV
          </div>
          {/* Meter bar with centre tick */}
          <div
            style={{
              display: "flex",
              width: 130,
              height: 8,
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              background: C.surface,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "50%",
                height: "100%",
                borderRadius: 4,
                background: C.accent,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -3,
                bottom: -3,
                width: 2,
                background: C.text,
                display: "flex",
              }}
            />
          </div>
        </div>
      </div>
    ),
  });
}

function Node({
  x, y, color, label, labelDy,
}: {
  x: number; y: number; color: string; label: string; labelDy: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          opacity: 0.55,
          display: "flex",
        }}
      />
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: color,
          opacity: 0.95,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          transform: `translateY(${labelDy}px)`,
          fontSize: 10,
          letterSpacing: 3,
          textTransform: "uppercase",
          color,
          opacity: 0.75,
          display: "flex",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Line({
  x1, y1, x2, y2, color, opacity,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; opacity: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return (
    <div
      style={{
        position: "absolute",
        width: length,
        height: 1,
        background: color,
        opacity,
        transform: `translate(${cx}px, ${cy}px) rotate(${angle}deg)`,
        transformOrigin: "center",
        display: "flex",
      }}
    />
  );
}
