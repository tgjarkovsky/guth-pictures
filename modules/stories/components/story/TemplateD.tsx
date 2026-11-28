"use client";
import { useEffect, useRef, useState } from 'react'
import { AScrim, ALabel, StoryChrome, StoryBrand, AccentEnd, ReplyIcon, S, fitHeadline, headlineStyle } from './primitives'
import { PhotoCycle } from './PhotoCycle'
import { useTick } from './useTick'
import type { Photo } from './types'

interface Props {
  photos: Photo[]
  duration: number
  paused: boolean
  lang: 'cs' | 'en'
  words: string[]
  subHeadline: string
  cta: string
  chrome?: boolean
  scale?: number
  exportTick?: number
  exportLayer?: 'photo' | 'overlay' | 'word'
}

export function TemplateD({ photos, duration, paused, lang, words, subHeadline, cta, chrome = false, scale = 1, exportTick, exportLayer }: Props) {
  const cs = lang === 'cs'
  const count = Math.max(words.length, 1)
  const tick = useTick(count, duration, paused || photos.length < 1, exportTick)

  const px = (n: number) => n * scale

  const showPhoto = exportLayer === undefined || exportLayer === 'photo'
  const showOverlay = exportLayer === undefined || exportLayer === 'overlay'
  const showWordOnly = exportLayer === 'word'
  const showWordInOverlay = exportLayer === undefined
  const bg = (exportLayer === 'overlay' || exportLayer === 'word') ? 'transparent' : S.bg
  const wordAt = (i: number) => words[i % words.length] || (cs ? 'Portréty.' : 'Portraits.')
  const wordStyle = (text: string) => ({
    ...headlineStyle(px(fitHeadline(text, 940, 216))),
    textAlign: 'center' as const, padding: `0 ${px(60)}px`,
  })

  // Track exiting word for preview exit animation (normal mode only)
  const prevTickRef = useRef(tick)
  const [exitTick, setExitTick] = useState<number | null>(null)
  useEffect(() => {
    if (exportLayer !== undefined) return
    const prev = prevTickRef.current
    if (prev !== tick) {
      prevTickRef.current = tick
      setExitTick(prev)
      const t = setTimeout(() => setExitTick(null), 650)
      return () => clearTimeout(t)
    }
  }, [tick, exportLayer])

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
          <AScrim topOpacity={0.65} bottomOpacity={0.92} />

          {chrome && <StoryChrome count={count} tick={tick} duration={duration} px={px} />}

          <StoryBrand top={chrome ? 220 : 260} px={px} />

          {/* Center flashing word — shown in normal mode only; export uses word layer */}
          {showWordInOverlay && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
              {/* Exiting word */}
              {exitTick !== null && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <h1
                    key={`exit-${exitTick}`}
                    style={{ ...wordStyle(wordAt(exitTick)), animation: 'wordOut 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}
                  >
                    <AccentEnd text={wordAt(exitTick)} />
                  </h1>
                </div>
              )}
              {/* Entering word */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1
                  key={`enter-${tick}`}
                  style={{ ...wordStyle(wordAt(tick)), animation: 'wordIn 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                >
                  <AccentEnd text={wordAt(tick)} />
                </h1>
              </div>
            </div>
          )}

          {/* Bottom block */}
          <div style={{
            position: 'absolute',
            left: px(80), right: px(80),
            bottom: px(260),
            zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(24),
          }}>
            <h2 style={{
              margin: 0,
              fontSize: px(42), fontWeight: 500,
              color: S.ink,
              textAlign: 'center', lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}>
              {subHeadline || (cs ? 'Silná atmosféra. Osobité portréty.' : 'Strong atmosphere. Distinctive portraits.')}
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: px(12), color: S.ink, fontSize: px(28), fontWeight: 600 }}>
              <ReplyIcon size={px(28)} color={S.accent} />
              {cta || (cs ? 'Odepiš rovnou na tuhle story' : 'Reply to this story')}
            </div>
            <ALabel size={px(17)}>
              {cs ? 'Více info v biu' : 'More info in bio'} · guthpictures.eu
            </ALabel>
          </div>
        </>
      )}

      {/* Word-only layer for export compositing */}
      {showWordOnly && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <h1 style={wordStyle(wordAt(tick))}>
            <AccentEnd text={wordAt(tick)} />
          </h1>
        </div>
      )}
    </div>
  )
}
