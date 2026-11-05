"use client";
import { AScrim, AGrain, AMono, StoryChrome, StoryBrand } from './primitives'
import { defaultColors as P } from '../../../../lib/theme-presets'
import { PhotoCycle } from './PhotoCycle'
import { useTick } from './useTick'
import type { Photo } from './types'

interface Props {
  photos: Photo[]
  duration: number
  paused: boolean
  lang: 'cs' | 'en'
  headline: string
  sub: string
  cta: string
  chrome?: boolean
  scale?: number
  exportTick?: number
  exportLayer?: 'photo' | 'overlay' | 'word'
}

export function TemplateC({ photos, duration, paused, lang, headline, sub, cta, chrome = false, scale = 1, exportTick, exportLayer }: Props) {
  const cs = lang === 'cs'
  const count = Math.max(photos.length, 1)
  const tick = useTick(count, duration, paused || photos.length < 2, exportTick)

  const captions = cs
    ? ['001 · Portréty', '002 · Eventy', '003 · Něco osobitého', '004 · Za světla', '005 · Portréty', '006 · Eventy']
    : ['001 · Portraits', '002 · Events', '003 · Something distinctive', '004 · Golden hour', '005 · Portraits', '006 · Events']

  const px = (n: number) => n * scale

  const showPhoto = exportLayer !== 'overlay'
  const showOverlay = exportLayer !== 'photo'
  const bg = exportLayer === 'overlay' ? 'transparent' : '#0A0A0B'

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      overflow: 'hidden',
      fontFamily: 'var(--story-font-sans)',
    }}>
      {showPhoto && (
        <PhotoCycle
          photos={photos}
          duration={duration}
          paused={paused}
          forceIndex={exportTick}
          isExportCapture={exportLayer === 'photo'}
        />
      )}

      {showOverlay && (
        <>
          <AScrim topOpacity={0.55} bottomOpacity={0.92} />

          {chrome && <StoryChrome count={count} tick={tick} duration={duration} px={px} />}

          <StoryBrand chrome={chrome} px={px}>
            <AMono
              key={tick}
              size={px(20)}
              tracking="0.26em"
              color="rgba(242,240,235,0.85)"
              style={{ marginTop: px(4), transition: 'opacity 400ms' }}
            >
              {captions[tick % captions.length]}
            </AMono>
          </StoryBrand>

          {/* Headline block */}
          <div style={{
            position: 'absolute',
            left: px(80), right: px(80),
            bottom: px(360),
            zIndex: 10,
          }}>
            <h1 style={{
              margin: 0,
              fontSize: px(168), fontWeight: 700, lineHeight: 0.88,
              letterSpacing: '-0.035em', color: P.text,
              whiteSpace: 'pre-line',
            }}>
              {headline || (cs ? 'Silná\natmosféra.' : 'Strong\natmosphere.')}
            </h1>
            <p style={{
              marginTop: px(32),
              fontSize: px(32), color: 'rgba(242,240,235,0.80)',
              lineHeight: 1.35, maxWidth: px(760),
            }}>
              {sub || (cs ? 'Osobité kreativní portréty.' : 'Distinctive creative portraits.')}
            </p>
          </div>

          {/* Bottom CTA */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: px(260),
            zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(16),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: px(14) }}>
              <svg width={px(30)} height={px(30)} viewBox="0 0 24 24" fill="none" stroke={P.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
              </svg>
              <span style={{ fontSize: px(30), fontWeight: 500, color: P.text }}>
                {cta || (cs ? 'Odepiš rovnou na tuhle story' : 'Reply to this story')}
              </span>
            </div>
            <AMono size={px(18)} color="rgba(242,240,235,0.60)" tracking="0.28em">
              {cs ? 'VÍCE INFO V BIO' : 'MORE INFO IN BIO'}
            </AMono>
          </div>

          <AGrain />
        </>
      )}
    </div>
  )
}
