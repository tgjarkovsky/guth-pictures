"use client";
import { AScrim, ALabel, StoryChrome, StoryBrand, AccentEnd, ReplyIcon, S, fitHeadline, headlineStyle } from './primitives'
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
  const bg = exportLayer === 'overlay' ? 'transparent' : S.bg
  const title = headline || (cs ? 'Silná\natmosféra.' : 'Strong\natmosphere.')

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg,
      overflow: 'hidden',
      fontFamily: S.sans,
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

          <StoryBrand top={chrome ? 220 : 260} px={px}>
            <ALabel key={tick} size={px(20)} color={S.inkMuted} style={{ marginTop: px(4) }}>
              {captions[tick % captions.length]}
            </ALabel>
          </StoryBrand>

          {/* Headline block */}
          <div style={{
            position: 'absolute',
            left: px(80), right: px(80),
            bottom: px(360),
            zIndex: 10,
          }}>
            <h1 style={headlineStyle(px(fitHeadline(title, 920, 150)))}>
              <AccentEnd text={title} />
            </h1>
            <p style={{
              marginTop: px(32),
              fontSize: px(32), color: S.inkMuted,
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
              <ReplyIcon size={px(30)} color={S.accent} />
              <span style={{ fontSize: px(30), fontWeight: 500, color: S.ink }}>
                {cta || (cs ? 'Odepiš rovnou na tuhle story' : 'Reply to this story')}
              </span>
            </div>
            <ALabel size={px(18)}>
              {cs ? 'Více info v biu' : 'More info in bio'}
            </ALabel>
          </div>
        </>
      )}
    </div>
  )
}
