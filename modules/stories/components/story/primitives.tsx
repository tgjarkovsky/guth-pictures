"use client";
import React, { type CSSProperties, type ReactNode } from 'react'

/**
 * Vzhled stories podle současného webu (editorial): kostěný text na neutrální černé,
 * wordmark v Syne jako hlavička webu, nadpisy i drobné texty v Epilogue, červený akcent jen na linkách
 * a koncové interpunkci nadpisu (jako „Jiný pohled.“ na homepage).
 * Písma dodává stránka přes CSS proměnné --story-font-display a --story-font-sans.
 */
export const S = {
  ink: '#f0efeb',
  inkMuted: 'rgba(240,239,235,0.78)',
  inkGhost: 'rgba(240,239,235,0.60)',
  bg: '#0e0d0c',
  accent: '#c93a2b',
  display: 'var(--story-font-display)',
  sans: 'var(--story-font-sans)',
} as const

/** Nadpis v Epilogue 800 (Syne je ve videu přes fotku moc široké). */
export const headlineStyle = (size: number): CSSProperties => ({
  margin: 0,
  fontFamily: S.sans,
  fontSize: size,
  fontWeight: 800,
  lineHeight: 0.95,
  letterSpacing: '-0.04em',
  color: S.ink,
  whiteSpace: 'pre-line',
})

/**
 * Šířky znaků Epilogue 800 při −0.04em (v em), naměřené v prohlížeči. Písmena jsou
 * nerovnoměrná (m ≈ 0.9em, i ≈ 0.23em), proto tabulka místo průměru. Diakritika se měří
 * podle základního písmene, neznámý znak počítá jako 0.7em.
 */
const HEADLINE_EM: Record<string, number> = {
  '0': 0.57, '1': 0.43, '2': 0.59, '3': 0.6, '4': 0.58, '5': 0.59, '6': 0.61, '7': 0.52, '8': 0.63, '9': 0.59,
  a: 0.59, b: 0.63, c: 0.6, d: 0.63, e: 0.61, f: 0.41, g: 0.6, h: 0.62, i: 0.23, j: 0.24, k: 0.55, l: 0.26, m: 0.91,
  n: 0.62, o: 0.61, p: 0.63, q: 0.63, r: 0.44, s: 0.53, t: 0.42, u: 0.61, v: 0.53, w: 0.8, x: 0.57, y: 0.54, z: 0.48,
  A: 0.64, B: 0.61, C: 0.68, D: 0.65, E: 0.54, F: 0.53, G: 0.69, H: 0.68, I: 0.25, J: 0.56, K: 0.65, L: 0.5, M: 0.91,
  N: 0.72, O: 0.72, P: 0.59, Q: 0.72, R: 0.61, S: 0.6, T: 0.56, U: 0.64, V: 0.63, W: 0.93, X: 0.65, Y: 0.62, Z: 0.56,
  ' ': 0.21, '.': 0.26, ',': 0.27, '!': 0.27, '?': 0.53, '-': 0.42, '–': 0.46, '&': 0.71, "'": 0.15, '’': 0.23,
  '"': 0.39, '„': 0.44, '“': 0.44, ':': 0.26, ';': 0.28, '…': 0.73,
}

/** Šířka řádku nadpisu v em (Epilogue 800). */
export function headlineWidthEm(line: string): number {
  let w = 0
  for (const ch of line.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) w += HEADLINE_EM[ch] ?? 0.7
  return w
}

/**
 * Velikost písma nadpisu (nejvýš `max`, 4 % rezerva). Přednostně se vejde každý řádek tak,
 * jak je napsaný; vyšel-by ale nadpis menší než 60 % `max`, nechá se zalomit a stačí,
 * aby se vešlo nejdelší slovo.
 */
export function fitHeadline(text: string, width: number, max: number): number {
  const fit = (parts: string[]) => Math.floor(width / (Math.max(...parts.map(headlineWidthEm), 1) * 1.04))
  const byLines = Math.min(max, fit(text.split('\n')))
  const floor = Math.floor(max * 0.6)
  return byLines >= floor ? byLines : Math.min(floor, fit(text.split(/\s+/)))
}

/** Koncová tečka / ! / ? v akcentové barvě; drží u posledního slova, aby se nezalomila sama. */
export function AccentEnd({ text }: { text: string }) {
  const m = /^([\s\S]*?)(\S*?)([.!?…]+)$/.exec(text)
  if (!m) return <>{text}</>
  return (
    <>
      {m[1]}
      <span style={{ whiteSpace: 'nowrap' }}>{m[2]}<span style={{ color: S.accent }}>{m[3]}</span></span>
    </>
  )
}

export const AScrim = ({ topOpacity = 0.55, bottomOpacity = 0.92 }: { topOpacity?: number; bottomOpacity?: number }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
    background: `linear-gradient(180deg, rgba(14,13,12,${topOpacity}) 0%, rgba(14,13,12,0) 35%, rgba(14,13,12,0.25) 65%, rgba(14,13,12,${bottomOpacity}) 100%)`,
  }} />
)

/** Drobný popisek verzálkami (Epilogue), jako navigace a kicker na webu. */
export const ALabel = ({
  children,
  color = S.inkGhost,
  size = 18,
  tracking = '0.16em',
  weight = 500,
  style,
}: {
  children: React.ReactNode
  color?: string
  size?: number
  tracking?: string
  weight?: number
  style?: CSSProperties
}) => (
  <span style={{
    fontFamily: S.sans,
    fontSize: size,
    letterSpacing: tracking,
    textTransform: 'uppercase',
    color,
    fontWeight: weight,
    ...style,
  }}>{children}</span>
)

export const ARule = ({ w = 80, h = 1, color = S.accent, style }: { w?: number; h?: number; color?: string; style?: CSSProperties }) => (
  <div style={{ width: w, height: h, background: color, flexShrink: 0, ...style }} />
)

/** Wordmark jako v hlavičce webu: Syne 700 verzálkami. */
export const Wordmark = ({ size }: { size: number }) => (
  <span style={{
    fontFamily: S.display, fontSize: size, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: S.ink, whiteSpace: 'nowrap',
  }}>Guth Pictures</span>
)

/** Instagram-style story header: progress bars + avatar row. */
export const StoryChrome = ({ count, tick, duration, px }: { count: number; tick: number; duration: number; px: (n: number) => number }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: `${px(32)}px ${px(36)}px 0`, fontFamily: S.sans }}>
    <div style={{ display: 'flex', gap: px(6), marginBottom: px(24) }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} style={{ flex: 1, height: px(4), borderRadius: px(2), background: 'rgba(255,255,255,0.30)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.95)',
            transform: `scaleX(${idx < tick ? 1 : idx === tick ? 1 : 0})`,
            transformOrigin: 'left',
            transition: idx === tick ? `transform ${duration}ms linear` : 'transform 200ms',
          }} />
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: px(14) }}>
      <div style={{ width: px(56), height: px(56), borderRadius: 999, background: S.bg, border: `${px(1.5)}px solid rgba(255,255,255,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.ink, fontFamily: S.display, fontSize: px(22), fontWeight: 700 }}>G</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: px(2) }}>
        <span style={{ color: S.ink, fontSize: px(20), fontWeight: 600 }}>guthpictures</span>
        <span style={{ color: 'rgba(240,239,235,0.7)', fontSize: px(16) }}>1h</span>
      </div>
    </div>
  </div>
)

/** Wordmark vlevo nahoře s červenou linkou; children pod linkou. */
export const StoryBrand = ({ top, side = 80, px, children }: { top: number; side?: number; px: (n: number) => number; children?: ReactNode }) => (
  <div style={{
    position: 'absolute',
    left: px(side), right: px(side),
    top: px(top),
    zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: px(22),
  }}>
    <Wordmark size={px(26)} />
    <ARule w={px(56)} h={Math.max(1, px(2))} />
    {children}
  </div>
)

/** Ikona bubliny u výzvy „Odepiš na story“. */
export const ReplyIcon = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
  </svg>
)
