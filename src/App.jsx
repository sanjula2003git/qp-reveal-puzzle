import { useEffect, useRef, useState } from 'react'
import {
  SLIDE_W, SLIDE_H, SLIDE_BG, FONT_STACK, FONT_PX, LINE_HEIGHT,
  TEXT_COLOR, SHAPE_OUTLINE, stripNoise, SOCIAL_MEDIA,
} from './slides.js'

const DWELL = 5000 // ms per text box in the spotlight

// ---- exact PPT shape artwork (translucent; text shows through) --------------
function ShapeArt({ type, fill }) {
  if (type === 'noSmoking') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden preserveAspectRatio="none">
        <defs><clipPath id="nsclip"><circle cx="50" cy="50" r="49" /></clipPath></defs>
        <path fillRule="evenodd" fill={fill} stroke={SHAPE_OUTLINE} strokeWidth="1.2"
          d="M50 1 A49 49 0 1 0 50 99 A49 49 0 1 0 50 1 Z M50 12 A38 38 0 1 1 50 88 A38 38 0 1 1 50 12 Z" />
        <g clipPath="url(#nsclip)">
          <rect x="4" y="44" width="92" height="12" fill={fill} transform="rotate(-45 50 50)" />
        </g>
      </svg>
    )
  }
  const puffs = [[30, 46, 18], [50, 33, 23], [72, 45, 18], [81, 60, 14], [63, 71, 19], [40, 72, 19], [21, 59, 15], [50, 57, 23]]
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden preserveAspectRatio="none">
      <circle cx="20" cy="86" r="7" fill={fill} stroke={SHAPE_OUTLINE} strokeWidth="0.8" />
      <circle cx="12" cy="94" r="4.5" fill={fill} stroke={SHAPE_OUTLINE} strokeWidth="0.8" />
      {puffs.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={p[2]} fill={fill} />)}
    </svg>
  )
}

export default function App() {
  const slide = SOCIAL_MEDIA
  const nText = slide.texts.length
  const [scale, setScale] = useState(1)
  const [isFs, setIsFs] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [eyeOn, setEyeOn] = useState(false)
  const [focus, setFocus] = useState(-1)
  const [wob, setWob] = useState({ p: 0, l: 0 }) // shape wobble: phase, level

  const appRef = useRef(null)
  const stageRef = useRef(null)
  const blankRef = useRef(0)
  const shakeRef = useRef(0)
  const phaseRef = useRef(0)
  const rafRef = useRef(0)
  const lastRef = useRef(0)

  // fit slide
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const fit = () => {
      const r = el.getBoundingClientRect()
      setScale(Math.min(r.width / SLIDE_W, r.height / SLIDE_H))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // spotlight timer
  useEffect(() => {
    if (!eyeOn) { setFocus(-1); return }
    setFocus(0)
    const id = setInterval(() => setFocus((f) => (f + 1) % nText), DWELL)
    return () => clearInterval(id)
  }, [eyeOn, nText])

  // shape wobble loop (rotate + oscillate back & forth), decays when released
  const ensureWobble = () => {
    if (rafRef.current) return
    lastRef.current = 0
    const step = (ts) => {
      if (!lastRef.current) lastRef.current = ts
      const dt = Math.min(0.05, (ts - lastRef.current) / 1000)
      lastRef.current = ts
      phaseRef.current += dt
      shakeRef.current = Math.max(0, shakeRef.current - dt * 1.15)
      setWob({ p: phaseRef.current, l: shakeRef.current })
      if (shakeRef.current > 0.002) rafRef.current = requestAnimationFrame(step)
      else { shakeRef.current = 0; setWob({ p: phaseRef.current, l: 0 }); rafRef.current = 0 }
    }
    rafRef.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // keys
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (mod && k === 'r') { e.preventDefault(); if (!hidden) { shakeRef.current = 1; ensureWobble() } return }
      if (mod && k === 'f') { e.preventDefault(); toggleFullscreen(); return }
      if (mod && (k === 's' || k === 'p' || k === 'u' || k === 'c')) { e.preventDefault(); return }
      if (e.key === 'PrintScreen') { blankNow(1000); try { navigator.clipboard?.writeText(' ') } catch {} }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('keyup', onKey, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true })
      window.removeEventListener('keyup', onKey, { capture: true })
    }
  }, [hidden])

  // capture guard
  useEffect(() => {
    const away = () => { setHidden(true); setEyeOn(false); shakeRef.current = 0 }
    const back = () => setHidden(false)
    const vis = () => (document.hidden ? away() : back())
    const noMenu = (e) => e.preventDefault()
    window.addEventListener('blur', away)
    window.addEventListener('focus', back)
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('contextmenu', noMenu)
    return () => {
      window.removeEventListener('blur', away)
      window.removeEventListener('focus', back)
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('contextmenu', noMenu)
    }
  }, [])

  const blankNow = (ms) => {
    setHidden(true); setEyeOn(false); shakeRef.current = 0
    clearTimeout(blankRef.current)
    blankRef.current = setTimeout(() => { if (!document.hidden && document.hasFocus()) setHidden(false) }, ms)
  }

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) appRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }
  const toggleEye = () => { if (!hidden) setEyeOn((o) => !o) }

  return (
    <div className={`app${isFs ? ' fs' : ''}`} ref={appRef}>
      <div className="ambient" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="logo"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M2 12 C5 6,19 6,22 12 C19 18,5 18,2 12 Z" fill="none" stroke="#0b140d" strokeWidth="2" /><circle cx="12" cy="12" r="3.4" fill="#0b140d" /></svg></span>
          <div className="brandtext">
            <h1>Python Question Bank</h1>
            <span className="subtitle">Secure Reveal · {slide.index + 1} of {slide.total}</span>
          </div>
        </div>
        <div className="actions">
          <span className="pill"><span className="dotpulse" /> {slide.label}</span>
          <span className="pill lock" title="Content blanks on capture, blur or tab switch">
            <svg viewBox="0 0 24 24" width="13" height="13"><path d="M6 10V7a6 6 0 1112 0v3" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="4" y="10" width="16" height="10" rx="2" fill="currentColor" /></svg>
            Protected
          </span>
          <button className="iconbtn" onClick={toggleFullscreen} title="Fullscreen (Ctrl+F)">
            <svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {isFs ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </header>

      <main className="stagewrap" ref={stageRef}>
        <div className="glow" />
        <div className="scaler" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
          <div className="slide" style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, backgroundColor: SLIDE_BG }}>
            {slide.texts.map((t, i) => {
              const focused = i === focus
              const rot = focused ? 0 : t.rot
              return (
                <div key={t.id} className={`tbox${focused ? ' focused' : ''}`}
                  style={{
                    left: t.x, top: t.y, width: t.w, height: t.h, zIndex: focused ? 20 : 1,
                    fontFamily: FONT_STACK, fontSize: FONT_PX, lineHeight: LINE_HEIGHT,
                    color: TEXT_COLOR, transform: `rotate(${rot}deg) scale(${focused ? 1.03 : 1})`,
                  }}>
                  {t.paras.map((p, k) => <p key={k}>{stripNoise(p)}</p>)}
                </div>
              )
            })}

            {slide.shapes.map((s, i) => {
              const l = wob.l, p = wob.p
              const rot = Math.sin(p * 6 + i * 2.1) * 16 * l
              const dx = Math.cos(p * 5 + i * 1.3) * 46 * l
              const dy = Math.sin(p * 7 + i * 0.7) * 30 * l
              return (
                <div key={s.id} className="shape"
                  style={{ left: s.x, top: s.y, width: s.w, height: s.h, zIndex: 5, transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)` }}>
                  <ShapeArt type={s.type} fill={s.fill} />
                </div>
              )
            })}

            {hidden && (
              <div className="guard">
                <div className="guardcard">
                  <svg viewBox="0 0 24 24" width="30" height="30"><path d="M6 10V7a6 6 0 1112 0v3" fill="none" stroke="#8ee0b6" strokeWidth="2" /><rect x="4" y="10" width="16" height="10" rx="2" fill="#8ee0b6" /></svg>
                  <b>Content hidden</b>
                  <small>Return focus to this window to continue</small>
                </div>
              </div>
            )}
          </div>

          <div className="hud">
            <button className={`eyebtn${eyeOn ? ' active' : ''}`} onClick={toggleEye}
              title="Reveal each box for 5 seconds" aria-label="Reveal text">
              <svg viewBox="0 0 40 40" width="21" height="21">
                <path d="M4 20 C10 10,30 10,36 20 C30 30,10 30,4 20 Z" fill="none" stroke={eyeOn ? '#57d98a' : '#c7d3ea'} strokeWidth="2.6" />
                <circle cx="20" cy="20" r="6.2" fill={eyeOn ? '#57d98a' : '#c7d3ea'} />
              </svg>
            </button>
            <div className="dockinfo">
              <div className="dockrow">
                <span className="docklabel">{eyeOn && focus >= 0 ? `Reading box ${focus + 1} of ${nText}` : 'Click the eye to reveal'}</span>
              </div>
              <div className="steps">
                {slide.texts.map((t, i) => (
                  <span key={t.id} className={`step${i === focus ? ' on' : ''}`}>
                    {i === focus && <i key={focus} />}
                  </span>
                ))}
              </div>
              <div className="dockhint">Hold <kbd>Ctrl</kbd>+<kbd>R</kbd> to shake the shapes</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="foot">
        <span><b>Eye</b> spotlights one box for 5s, flipping the upside-down block upright · <b>Ctrl+R</b> rotates &amp; wobbles the shapes · <b>Ctrl+F</b> fullscreen</span>
        <span className="hint2">Switch away or try to capture → it hides</span>
      </footer>
    </div>
  )
}
