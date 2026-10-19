import { ImageResponse } from "next/og";

// Mirrors the homepage hero card: dark mat, cream Syne letter, oxblood mark (globals.css .editorial-home).
const DARK = "#232120";
const INK = "#f1eee9";
const ACCENT = "#c4574a";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

async function loadSyne(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Syne:wght@800&text=G.")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Icon() {
  const syne = await loadSyne();
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: DARK,
          fontFamily: syne ? "Syne" : "serif",
          fontWeight: 800,
          fontSize: 24,
          lineHeight: 1,
          letterSpacing: -1,
        }}
      >
        <span style={{ color: INK }}>G</span>
        <span style={{ color: ACCENT }}>.</span>
      </div>
    ),
    { ...size, fonts: syne ? [{ name: "Syne", data: syne, weight: 800, style: "normal" }] : [] }
  );
}
