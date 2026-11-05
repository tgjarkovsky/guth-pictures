"use client";
import React, { type CSSProperties, type ReactNode } from 'react'
import { defaultColors as P } from '../../../../lib/theme-presets'

export const AScrim = ({ topOpacity = 0.55, bottomOpacity = 0.92 }: { topOpacity?: number; bottomOpacity?: number }) => (
  <>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
      background: `linear-gradient(180deg, rgba(0,0,0,${topOpacity}) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.25) 65%, rgba(10,10,11,${bottomOpacity}) 100%)`,
    }} />
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, mixBlendMode: 'multiply',
      background: 'linear-gradient(0deg, rgba(90,48,25,0.10), rgba(90,48,25,0.10))',
    }} />
  </>
)

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`

export const AGrain = ({ opacity = 0.06 }: { opacity?: number }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity, zIndex: 5,
    backgroundImage: GRAIN_SVG,
    backgroundSize: '220px 220px',
  }} />
)

export const AMono = ({
  children,
  color = 'rgba(242,240,235,0.65)',
  size = 18,
  tracking = '0.22em',
  weight = 400,
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
    fontFamily: 'var(--story-font-mono)',
    fontSize: size,
    letterSpacing: tracking,
    textTransform: 'uppercase',
    color,
    fontWeight: weight,
    ...style,
  }}>{children}</span>
)

export const ARule = ({ w = 80, color = 'rgba(242,240,235,0.35)', style }: { w?: number; color?: string; style?: CSSProperties }) => (
  <div style={{ width: w, height: 1, background: color, flexShrink: 0, ...style }} />
)

/** Instagram-style story header: progress bars + avatar row. */
export const StoryChrome = ({ count, tick, duration, px }: { count: number; tick: number; duration: number; px: (n: number) => number }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: `${px(32)}px ${px(36)}px 0` }}>
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
      <div style={{ width: px(56), height: px(56), borderRadius: 999, background: 'linear-gradient(180deg,#1E1E23,#0A0A0B)', border: `${px(1.5)}px solid rgba(255,255,255,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.text, fontSize: px(22), fontWeight: 700, letterSpacing: '-0.02em' }}>G</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: px(2) }}>
        <span style={{ color: P.text, fontSize: px(20), fontWeight: 600 }}>guthpictures</span>
        <span style={{ color: 'rgba(242,240,235,0.7)', fontSize: px(16) }}>1h</span>
      </div>
    </div>
  </div>
)

/** Top-left brand mark; children render under the rule. */
export const StoryBrand = ({ chrome, px, children }: { chrome: boolean; px: (n: number) => number; children?: ReactNode }) => (
  <div style={{
    position: 'absolute',
    left: px(80), right: px(80),
    top: chrome ? px(220) : px(260),
    zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: px(22),
  }}>
    <AMono size={px(24)} tracking="0.34em" color={P.text} weight={500}>GUTH&nbsp;&nbsp;PICTURES</AMono>
    <ARule w={px(72)} color={P.accentSecondary} />
    {children}
  </div>
)
