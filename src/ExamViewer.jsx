import { useEffect, useMemo, useRef, useState } from 'react'
import {
  SLIDE_W, SLIDE_H, SLIDE_BG, FONT_STACK, FONT_PX, LINE_HEIGHT,
  TEXT_COLOR, SHAPE_OUTLINE, stripNoise, decode,
} from './slides.js'

// --- reveal mechanic ---------------------------------------------------------
// TWO hold-to-activate controls that must be used TOGETHER to read the slide:
//   • TEXT toggle (the "A" button, hold with the mouse / Space) — while held it
//     flips every scrambled box upright; release and it drops back to the wrong
//     angle. Never touches the shapes.
//   • SHAPES control (Ctrl+R held, or the layers button held) — while held it
//     sends every shape BEHIND the text (shapes stay on screen, they just drop
//     in z-order) so the buried text comes forward. Release and they cover again.
// Holding BOTH at once = text forward AND upright = the only way to read it.
const SHAPE_SCALE = 1.22 // enlarge shapes so they overlap the text (and each other)

// exact PPT shape artwork (translucent; text shows through) --------------------
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
  if (type === 'ellipse') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden preserveAspectRatio="none">
        <ellipse cx="50" cy="50" rx="49.4" ry="49.4" fill={fill} stroke={SHAPE_OUTLINE} strokeWidth="0.7" />
      </svg>
    )
  }
  if (type === 'chevron') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden preserveAspectRatio="none">
        <path d="M3 3 L53 3 L97 50 L53 97 L3 97 L47 50 Z" fill={fill} stroke={SHAPE_OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === 'lightningBolt') {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden preserveAspectRatio="none">
        <path d="M55 2 L20 57 L43 57 L34 98 L83 39 L58 39 Z" fill={fill} stroke={SHAPE_OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
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

export default function ExamViewer({ slide, qIndex = 0, qTotal = 1 }) {
  const [scale, setScale] = useState(1)
  const [isFs, setIsFs] = useState(false)
  const [locked, setLocked] = useState(false)  // capture attempt → 30s hard lock
  const [holding, setHolding] = useState(false)       // text toggle held → upright
  const [shapesBack, setShapesBack] = useState(false) // Ctrl+R held → shapes behind
  const [lockLeft, setLockLeft] = useState(0)  // seconds remaining on the capture lock

  const appRef = useRef(null)
  const stageRef = useRef(null)

  // live refs so the global key handler never binds stale values
  const lockLeftRef = useRef(0); lockLeftRef.current = lockLeft
  const blocked = locked
  const blockedRef = useRef(false); blockedRef.current = blocked

  // fixed shape geometry (centre + scaled size), carrying any PPT rotation
  const geo = useMemo(() => slide.shapes.map((s) => {
    const w = s.w * SHAPE_SCALE, h = s.h * SHAPE_SCALE
    const cx = s.x + s.w / 2, cy = s.y + s.h / 2
    return { cx, cy, w, h, x: cx - w / 2, y: cy - h / 2, rot: s.rot || 0 }
  }), [slide])

  // how many boxes are scrambled (need the text toggle held to read them)
  const nWrong = useMemo(
    () => slide.texts.filter((t) => (((t.rot % 360) + 360) % 360) !== 0).length,
    [slide])

  // fit slide to the stage
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

  // ---- lock / hide helpers ----
  // capture attempt → hide everything for at least 30s (Resume is dead until then)
  const lockNow = () => {
    setLocked(true); setShapesBack(false); setHolding(false); setLockLeft(30)
    try { navigator.clipboard?.writeText(' ') } catch {}
  }
  const resume = () => { if (lockLeftRef.current === 0 && !document.hidden && document.hasFocus()) setLocked(false) }

  // tick the capture-lock countdown down to 0 while locked
  useEffect(() => {
    if (!locked) return
    const id = setInterval(() => setLockLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [locked])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) appRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  // PrintScreen shows up under e.key OR e.code, and (in most Windows browsers)
  // only on keyup — so we check every angle. Note: the OS may swallow the key
  // entirely before the page sees it; that's a browser limit (Electron is exact).
  const isCapture = (e) =>
    e.key === 'PrintScreen' || e.code === 'PrintScreen' ||
    e.key === 'Snapshot' || e.keyCode === 44

  // ---- global keys (split keydown / keyup so hold works and nothing double-fires)
  useEffect(() => {
    const onDown = (e) => {
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      // capture attempts -> lock the screen
      if (isCapture(e)) { e.preventDefault(); lockNow(); return }
      if (e.shiftKey && (e.metaKey || e.ctrlKey) && k === 's') { e.preventDefault(); lockNow(); return } // Win+Shift+S snip
      if (locked) { if (e.key === 'Escape') resume(); e.preventDefault(); return } // swallow all while locked
      // Ctrl+R = HOLD to send shapes behind the text (preventDefault kills the browser reload)
      if (mod && k === 'r') { e.preventDefault(); if (!blockedRef.current) setShapesBack(true); return }
      if (mod && k === 'f') { e.preventDefault(); toggleFullscreen(); return }
      if (mod && (k === 's' || k === 'p' || k === 'u' || k === 'c')) { e.preventDefault(); return }
    }
    const onUp = (e) => {
      const k = e.key.toLowerCase()
      if (isCapture(e)) { e.preventDefault(); lockNow(); return } // PrintScreen usually only fires keyup
      // releasing R (or the modifier) lets the shapes cover again
      if (k === 'r' || k === 'control' || k === 'meta') { e.preventDefault(); setShapesBack(false) }
    }
    // listen on window AND document, capture phase, to catch it wherever it lands
    for (const tgt of [window, document]) {
      tgt.addEventListener('keydown', onDown, { capture: true })
      tgt.addEventListener('keyup', onUp, { capture: true })
    }
    return () => {
      for (const tgt of [window, document]) {
        tgt.removeEventListener('keydown', onDown, { capture: true })
        tgt.removeEventListener('keyup', onUp, { capture: true })
      }
    }
  }, [locked])

  // keep keyboard focus inside the viewer so key events actually reach it
  // (inside an iframe, keys only fire when the frame is focused)
  useEffect(() => {
    appRef.current?.focus()
  }, [])

  // Block the right-click menu (tab-switch / window-blur is handled one level up in
  // <Exam> as a full exam restart, so we don't also 30s-lock here on focus loss).
  useEffect(() => {
    const noMenu = (e) => e.preventDefault()
    window.addEventListener('contextmenu', noMenu)
    return () => window.removeEventListener('contextmenu', noMenu)
  }, [])

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // never leave the slide readable once the screen is blocked
  useEffect(() => { if (blocked) { setHolding(false); setShapesBack(false) } }, [blocked])

  // pointer-hold handlers for the two dock buttons (mouse + touch; two fingers = both)
  const textOn = (e) => { if (e) e.preventDefault(); if (!blocked) setHolding(true) }
  const textOff = () => setHolding(false)
  const shapeOn = (e) => { if (e) e.preventDefault(); if (!blocked) setShapesBack(true) }
  const shapeOff = () => setShapesBack(false)

  const readable = holding && shapesBack

  return (
    <div className={`app${isFs ? ' fs' : ''}`} ref={appRef} tabIndex={-1}
      onPointerDown={() => appRef.current?.focus()}>
      <div className="ambient" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="logo"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M2 12 C5 6,19 6,22 12 C19 18,5 18,2 12 Z" fill="none" stroke="#ffffff" strokeWidth="2" /><circle cx="12" cy="12" r="3.4" fill="#ffffff" /></svg></span>
          <div className="brandtext">
            <h1>Python Assessment</h1>
            <span className="subtitle">Secure Reveal · Question {qIndex + 1} of {qTotal}</span>
          </div>
        </div>
        <div className="actions">
          <span className="pill"><span className="dotpulse" /> {slide.label}</span>
          <span className="pill lock" title="Content locks on capture, blur or tab switch">
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
          <div className="slide" style={{
            width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`,
            backgroundColor: slide.bg?.color || SLIDE_BG,
            backgroundImage: slide.bg?.image || 'none',
            backgroundSize: slide.bg?.size || 'auto',
            backgroundPosition: slide.bg?.position || '0 0',
          }}>
            {slide.texts.map((t, i) => {
              const rot = holding ? 0 : t.rot   // hold the text toggle to flip every box upright
              return (
                <div key={t.id} className={`tbox${shapesBack ? ' spotlit' : ''}`}
                  style={{
                    left: t.x, top: t.y, width: t.w, height: t.h, zIndex: shapesBack ? 8 : 1,
                    fontFamily: FONT_STACK, fontSize: FONT_PX, lineHeight: LINE_HEIGHT,
                    color: TEXT_COLOR, transform: `rotate(${rot}deg)`,
                  }}>
                  {t.paras.map((p, k) => <p key={k}>{holding ? decode(p) : stripNoise(p)}</p>)}
                </div>
              )
            })}

            {slide.shapes.map((s, i) => {
              const g = geo[i]
              // hold Ctrl+R: shapes drop behind the text but stay exactly where they are
              return (
                <div key={s.id} className={`shape${shapesBack ? ' back' : ''}${holding ? ' dim' : ''}`}
                  style={{ left: g.x, top: g.y, width: g.w, height: g.h, zIndex: shapesBack ? 0 : 5, transform: g.rot ? `rotate(${g.rot}deg)` : undefined }}>
                  <ShapeArt type={s.type} fill={s.fill} />
                </div>
              )
            })}
          </div>

          {blocked && (
            <div className="lockscreen hard">
              <div className="guardcard">
                <svg viewBox="0 0 24 24" width="34" height="34"><path d="M6 10V7a6 6 0 1112 0v3" fill="none" stroke="#fff" strokeWidth="2" /><rect x="4" y="10" width="16" height="10" rx="2" fill="#fff" /></svg>
                <b>Screen locked</b>
                <small>A screen-capture or window switch was detected. Content stays hidden for 30 seconds.</small>
                <button className="resumebtn" onClick={resume} disabled={lockLeft > 0}>
                  {lockLeft > 0 ? `Resume in ${lockLeft}s` : 'Resume'}
                </button>
              </div>
            </div>
          )}

          <div className="hud">
            <div className="holdpair">
              <button className={`eyebtn${holding ? ' active' : ''}`}
                onPointerDown={textOn} onPointerUp={textOff} onPointerLeave={textOff} onPointerCancel={textOff}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') textOn(e) }}
                onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') textOff() }}
                onContextMenu={(e) => e.preventDefault()}
                title="Hold to turn the text upright" aria-label="Hold to turn the text upright" aria-pressed={holding}>
                <svg viewBox="0 0 40 40" width="20" height="20">
                  <text x="20" y="27" textAnchor="middle" fontSize="20" fontWeight="800"
                    fill={holding ? '#57d98a' : '#c7d3ea'}
                    style={{ transform: holding ? 'none' : 'rotate(180deg)', transformOrigin: '20px 20px', transition: 'transform .4s ease' }}>A</text>
                </svg>
              </button>
              <button className={`eyebtn${shapesBack ? ' active' : ''}`}
                onPointerDown={shapeOn} onPointerUp={shapeOff} onPointerLeave={shapeOff} onPointerCancel={shapeOff}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') shapeOn(e) }}
                onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') shapeOff() }}
                onContextMenu={(e) => e.preventDefault()}
                title="Hold (or hold Ctrl+R) to send the shapes behind the text"
                aria-label="Hold to send the shapes behind the text" aria-pressed={shapesBack}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none"
                  stroke={shapesBack ? '#57d98a' : '#c7d3ea'} strokeWidth="2" strokeLinejoin="round">
                  <rect x="3.5" y="3.5" width="12" height="12" rx="2.2" />
                  <rect x="8.5" y="8.5" width="12" height="12" rx="2.2" fill={shapesBack ? 'rgba(87,217,138,0.22)' : 'rgba(10,16,12,0.85)'} />
                </svg>
              </button>
            </div>
            <div className="dockinfo">
              <div className="docklabel">
                {readable ? 'Readable — keep both held'
                  : holding ? 'Now hold the ⊞ button (or Ctrl+R)'
                  : shapesBack ? 'Now hold the A button (text)'
                  : nWrong > 0 ? `Hold BOTH to read · ${nWrong} scrambled`
                  : 'Hold BOTH to read'}
              </div>
              <div className="statuspair">
                <span className={`chip${holding ? ' on' : ''}`}>Text upright</span>
                <span className={`chip${shapesBack ? ' on' : ''}`}>Shapes back</span>
              </div>
              <div className="dockhint">Hold <b>A</b> + <b>⊞</b> (or <kbd>Ctrl</kbd>+<kbd>R</kbd>) to read</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="foot">
        <span><b>Hold the A button</b> (text upright) <b>and</b> the <b>⊞ button</b> or <b>Ctrl+R</b> (shapes behind) together to read · release either and it re-scrambles · <b>Ctrl+F</b> fullscreen</span>
        <span className="hint2">Capture attempt or leaving the window → locked for 30s</span>
      </footer>
    </div>
  )
}
