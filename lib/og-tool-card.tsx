import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { defaultColors as P } from "@/lib/theme-presets";

// Static images can't read KV — they render the shipped default preset.
const alpha = (hex: string, a: number) =>
  hex + Math.round(a * 255).toString(16).padStart(2, "0");

export const ogSize = { width: 1200, height: 630 };

export const C = {
  bg:        P.bg,
  elevated:  P.bgElevated,
  surface:   P.surface,
  text:      P.text,
  muted:     P.textMuted,
  ghost:     P.textGhost,
  accent:    P.accentSecondary,
  border:    alpha(P.text, 0.10),
  borderSub: alpha(P.text, 0.06),
} as const;

interface ToolCard {
  title: [string, string];
  subtitle: string[];
  tags: string[];
  diagram: ReactNode;
}

/** OG card for the interactive tools: typography on the left, a diagram on the right. */
export function toolCardImage({ title, subtitle, tags, diagram }: ToolCard) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: C.bg,
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Vertical divider */}
        <div
          style={{
            position: "absolute",
            left: 680,
            top: 0,
            bottom: 0,
            width: 1,
            background: C.borderSub,
            display: "flex",
          }}
        />

        {/* Accent top-bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(to right, ${C.accent}, transparent 60%)`,
            display: "flex",
          }}
        />

        {/* ── LEFT: Typography ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            width: 680,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 12,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: C.ghost,
              marginBottom: 28,
            }}
          >
            GUTH PICTURES
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {title.map((line, i) => (
              <div
                key={line}
                style={{
                  display: "flex",
                  fontSize: 96,
                  fontWeight: 700,
                  color: i === 0 ? C.text : C.accent,
                  letterSpacing: -4,
                  lineHeight: 0.88,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              width: 44,
              height: 2,
              background: C.accent,
              margin: "32px 0",
              opacity: 0.6,
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {subtitle.map((line) => (
              <div key={line} style={{ display: "flex", fontSize: 20, color: C.muted, lineHeight: 1.5 }}>
                {line}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "5px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: C.ghost,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: diagram column (flex: 1, position: relative) ── */}
        {diagram}
      </div>
    ),
    ogSize
  );
}
