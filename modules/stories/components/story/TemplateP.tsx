"use client";
import { AScrim, ALabel, ARule, StoryBrand, StoryChrome, AccentEnd, S, fitHeadline, headlineStyle } from './primitives'
import { PhotoCycle } from './PhotoCycle'
import { useTick } from './useTick'
import type { Photo } from './types'
import type { StoryFormat } from '../../lib/types'

export type VoucherCardTheme = 'snow' | 'noir' | 'riviera' | 'ivy'

/** Rozměry plátna podle formátu: stories/reels 9:16, feed 4:5. */
export const FORMAT_SIZE: Record<StoryFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  feed: { w: 1080, h: 1350 },
}

/** Karta poukazu drží na konci déle než fotky, ať se stihne přečíst cena. */
export const cardSlideMs = (duration: number) => Math.max(Math.round(duration * 1.6), 3600)

/** Fotky + jeden závěrečný snímek s kartou poukazu. */
export const voucherSlideCount = (photoCount: number) => Math.max(photoCount, 1) + 1

export const voucherDefaults = (lang: 'cs' | 'en') => lang === 'cs'
  ? {
      kicker: 'Vánoční dárek',
      headline: 'Darujte\nfotky, které\nzůstanou.',
      sub: 'Dárkový poukaz na portrétní focení v Praze.',
      label: 'Dárkový poukaz na focení',
      note: 'Do pár minut e-mailem · platí 12 měsíců',
      cta: 'guthpictures.eu/darkovy-poukaz',
      strip: 'Dárkový poukaz · guthpictures.eu',
    }
  : {
      kicker: 'Christmas gift',
      headline: 'Give\nphotos that\nstay.',
      sub: 'A gift voucher for a portrait session in Prague.',
      label: 'Photo session gift voucher',
      note: 'By e-mail within minutes · valid 12 months',
      cta: 'guthpictures.eu/en/darkovy-poukaz',
      strip: 'Gift voucher · guthpictures.eu',
    }

interface Props {
  photos: Photo[]
  duration: number
  paused: boolean
  lang: 'cs' | 'en'
  kicker: string
  headline: string
  sub: string
  price: string
  cta: string
  theme: VoucherCardTheme
  format: StoryFormat
  chrome?: boolean
  scale?: number
  exportTick?: number
  exportLayer?: 'photo' | 'overlay' | 'word'
}

export function TemplateP({
  photos, duration, paused, lang, kicker, headline, sub, price, cta, theme, format,
  chrome = false, scale = 1, exportTick, exportLayer,
}: Props) {
  const t = voucherDefaults(lang)
  const photoSlides = Math.max(photos.length, 1)
  const tick = useTick(photoSlides + 1, duration, paused || photos.length < 1, exportTick)
  const isCard = tick >= photoSlides
  const feed = format === 'feed'
  const px = (n: number) => n * scale

  const exporting = exportLayer !== undefined
  const bg = exportLayer === 'overlay' || exportLayer === 'word' ? 'transparent' : S.bg

  // Rozložení: story drží text mimo horních ~13 % a spodních ~22 % (UI Instagramu a tlačítko reklamy).
  const L = feed
    ? { side: 80, top: 84, bottom: 96, headline: 116, sub: 30, cardW: 400, cardTop: 150, price: 92 }
    : { side: 80, top: 250, bottom: 440, headline: 150, sub: 34, cardW: 540, cardTop: 350, price: 112 }
  const title = headline || t.headline
  const cardH = L.cardW * 874 / 620

  const cardSrc = `/api/vouchers/design/${theme}?locale=${lang}`

  const brandTop = chrome && !feed ? 220 : L.top

  const photoOverlay = (
    <>
      <AScrim topOpacity={0.55} bottomOpacity={0.94} />
      <StoryBrand top={brandTop} side={L.side} px={px}>
        <ALabel size={px(22)} color={S.inkMuted} style={{ marginTop: px(4) }}>
          {kicker || t.kicker}
        </ALabel>
      </StoryBrand>
      <div style={{ position: 'absolute', left: px(L.side), right: px(L.side), bottom: px(L.bottom), zIndex: 10 }}>
        <h1 style={headlineStyle(px(fitHeadline(title, 1080 - 2 * L.side, L.headline)))}>
          <AccentEnd text={title} />
        </h1>
        <p style={{
          margin: `${px(30)}px 0 0`, fontSize: px(L.sub), color: S.inkMuted,
          lineHeight: 1.35, maxWidth: px(800),
        }}>
          {sub || t.sub}
        </p>
      </div>
      <div style={{
        position: 'absolute', left: px(L.side), right: px(L.side), bottom: px(feed ? 40 : L.bottom - 90), zIndex: 10,
        display: 'flex', alignItems: 'center', gap: px(16),
      }}>
        <ARule w={px(40)} h={Math.max(1, px(2))} />
        <ALabel size={px(18)}>{t.strip}</ALabel>
      </div>
    </>
  )

  // Texty pod kartou; samotná karta je ve vrstvě 'word', aby v exportu přijela s pohybem.
  const cardOverlay = (
    <>
      <StoryBrand top={brandTop} side={L.side} px={px} />
      <div style={{
        position: 'absolute', left: px(L.side), right: px(L.side), top: px(L.cardTop + cardH + (feed ? 44 : 64)), zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(feed ? 14 : 20), textAlign: 'center',
      }}>
        <ALabel size={px(20)} color={S.inkMuted}>{t.label}</ALabel>
        <div style={{ ...headlineStyle(px(L.price)), lineHeight: 1, whiteSpace: 'nowrap' }}>
          {price}
        </div>
        <div style={{ fontSize: px(feed ? 26 : 30), color: S.inkMuted, lineHeight: 1.3 }}>{t.note}</div>
        <div style={{
          marginTop: px(feed ? 6 : 14), display: 'inline-flex', alignItems: 'center', gap: px(14),
          fontSize: px(feed ? 26 : 30), fontWeight: 600, color: S.ink,
          borderBottom: `${Math.max(1, px(2))}px solid ${S.accent}`, paddingBottom: px(8),
        }}>
          {cta || t.cta}
        </div>
      </div>
    </>
  )

  const cardBackground = (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(ellipse 80% 55% at 50% 32%, rgba(240,239,235,0.07) 0%, rgba(14,13,12,0) 70%), ${S.bg}`,
    }} />
  )

  const card = (animate: boolean) => (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: px(L.cardTop), zIndex: 12,
      display: 'flex', justifyContent: 'center',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={animate ? `card-${tick}` : 'card'}
        src={cardSrc}
        alt=""
        crossOrigin="anonymous"
        style={{
          width: px(L.cardW), height: px(cardH), display: 'block',
          transform: 'rotate(-3deg)',
          boxShadow: `0 ${px(30)}px ${px(80)}px rgba(0,0,0,0.55)`,
          animation: animate ? 'wordIn 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : undefined,
        }}
      />
    </div>
  )

  if (exporting) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden', fontFamily: S.sans }}>
        {exportLayer === 'photo' && (isCard
          ? cardBackground
          : <PhotoCycle photos={photos} duration={duration} paused forceIndex={tick} isExportCapture />)}
        {exportLayer === 'overlay' && (isCard ? cardOverlay : photoOverlay)}
        {exportLayer === 'word' && isCard && card(false)}
      </div>
    )
  }

  const fade = (visible: boolean) => ({
    position: 'absolute', inset: 0, opacity: visible ? 1 : 0,
    transition: 'opacity 800ms cubic-bezier(0.25,0.46,0.45,0.94)',
  }) as const

  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden', fontFamily: S.sans }}>
      <PhotoCycle photos={photos} duration={duration} paused={paused} />
      <div style={{ ...fade(isCard), zIndex: 2 }}>{cardBackground}</div>
      <div style={{ ...fade(!isCard), zIndex: 3 }}>{photoOverlay}</div>
      <div style={{ ...fade(isCard), zIndex: 3 }}>
        {cardOverlay}
        {isCard && card(true)}
      </div>
      {chrome && <StoryChrome count={photoSlides + 1} tick={tick} duration={duration} px={px} />}
    </div>
  )
}
