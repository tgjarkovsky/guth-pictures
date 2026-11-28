"use client";
import React, { type CSSProperties, type ReactNode } from 'react'

/**
 * Vzhled stories podle současného webu (editorial): kostěný text na neutrální černé,
 * nadpisy v Syne, drobné texty v Epilogue verzálkami, červený akcent jen na linkách
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

/** Nadpis v Syne jako na webu. */
export const headlineStyle = (size: number): CSSProperties => ({
  margin: 0,
  fontFamily: S.display,
  fontSize: size,
  fontWeight: 800,
  lineHeight: 1, // Syne má vysokou diakritiku, při menším řádkování by se ř/ů dotýkaly řádku nad sebou
  letterSpacing: '-0.04em',
  color: S.ink,
  whiteSpace: 'pre-line',
})

/**
 * Šířky znaků Syne 800 při −0.04em (v em), naměřené v prohlížeči. Syne je hodně široké
 * a nerovnoměrné (m ≈ 1.6em, i ≈ 0.3em), proto tabulka místo průměru. Diakritika se měří
 * podle základního písmene, neznámý znak počítá jako 1em.
 */
const SYNE_EM: Record<string, number> = {
  a: 1.02, b: 1.06, c: 0.95, d: 1.06, e: 0.95, f: 0.63, g: 0.9, h: 0.97, i: 0.32, j: 0.32, k: 0.9, l: 0.32, m: 1.61,
  n: 0.96, o: 0.98, p: 1.02, q: 1.06, r: 0.52, s: 0.8, t: 0.59, u: 0.96, v: 0.88, w: 1.42, x: 0.94, y: 0.89, z: 0.86,
  A: 1.12, B: 1.1, C: 1.28, D: 1.26, E: 1.1, F: 1.09, G: 1.3, H: 1.24, I: 0.38, J: 0.96, K: 1.17, L: 0.9, M: 1.54,
  N: 1.26, O: 1.29, P: 1.14, Q: 1.29, R: 1.19, S: 1.02, T: 1.06, U: 1.25, V: 1.12, W: 1.84, X: 1.1, Y: 1.03, Z: 1.16,
  '0': 1.03, '1': 0.49, '2': 0.96, '3': 1.01, '4': 1.05, '5': 0.97, '6': 1.09, '7': 1.09, '8': 1.04, '9': 1.12,
  ' ': 0.27, '.': 0.31, ',': 0.26, '!': 0.35, '?': 0.82, '-': 0.55, '–': 0.66, '&': 1.18, "'": 0.26, '’': 0.26,
  '"': 0.56, '„': 0.57, '“': 0.57, ':': 0.31, ';': 0.31, '…': 1,
}

/** Šířka řádku v em (Syne 800). */
export function syneWidthEm(line: string): number {
  let w = 0
  for (const ch of line.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) w += SYNE_EM[ch] ?? 1
  return w
}

/**
 * Velikost písma nadpisu (nejvýš `max`, 4 % rezerva). Přednostně se vejde každý řádek tak,
 * jak je napsaný; vyšel-by ale nadpis menší než 60 % `max`, nechá se zalomit a stačí,
 * aby se vešlo nejdelší slovo.
 */
export function fitHeadline(text: string, width: number, max: number): number {
  const fit = (parts: string[]) => Math.floor(width / (Math.max(...parts.map(syneWidthEm), 1) * 1.04))
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
      <div style={{ width: px(56), height: px(56), borderRadius: 999, background: S.bg, border: `${px(1.5)}px solid rgba(255,255,255,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.ink, fontFamily: S.display, fontSize: px(22), fontWeight: 800 }}>G</div>
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
