import { C, ogSize, toolCardImage } from "@/lib/og-tool-card";

export const runtime = "edge";
export const alt = "Light Tester — Guth Pictures";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return toolCardImage({
    title: ["Light", "Tester"],
    subtitle: ["Interaktivní simulátor", "studiového osvětlení"],
    tags: ["3D scéna", "Světla", "Gely", "Presety"],
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
        {/* Outer studio bounds circle */}
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.18)",
            display: "flex",
          }}
        />

        {/* Inner room circle */}
        <div
          style={{
            position: "absolute",
            width: 230,
            height: 230,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
            display: "flex",
          }}
        />

        {/* KEY light — top-left — accent/warm */}
        <LightSource x={-108} y={-120} color={C.accent} label="KEY" />

        {/* FILL light — top-right — muted */}
        <LightSource x={100} y={-110} color={C.muted} label="FILL" />

        {/* RIM light — bottom-center — cool */}
        <LightSource x={0} y={138} color="#7BA7BC" label="RIM" />

        {/* Lines from lights to center */}
        <Line x1={-108} y1={-120} x2={0} y2={0} color={C.accent} opacity={0.50} />
        <Line x1={100} y1={-110} x2={0} y2={0} color={C.muted} opacity={0.38} />
        <Line x1={0} y1={138} x2={0} y2={0} color="#7BA7BC" opacity={0.42} />

        {/* Subject — center circle */}
        <div
          style={{
            position: "absolute",
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: C.surface,
            border: "2px solid rgba(255,255,255,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: C.muted,
              display: "flex",
            }}
          />
        </div>

        {/* SUBJECT label */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, 30px)",
            fontSize: 9,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: C.ghost,
            display: "flex",
            whiteSpace: "nowrap",
          }}
        >
          SUBJECT
        </div>

        {/* TOP VIEW label */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 24,
            fontSize: 9,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: C.ghost,
            display: "flex",
          }}
        >
          TOP VIEW
        </div>
      </div>
    ),
  });
}

function LightSource({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* Outer glow ring */}
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
      {/* Light body */}
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
      {/* Label */}
      <div
        style={{
          fontSize: 9,
          letterSpacing: 3,
          textTransform: "uppercase",
          color,
          opacity: 0.7,
          marginTop: 20,
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
        transform: `translate(${cx - length / 2}px, ${cy}px) rotate(${angle}deg)`,
        transformOrigin: "center",
        display: "flex",
      }}
    />
  );
}
