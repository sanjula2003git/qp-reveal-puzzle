import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import ExamViewer from './ExamViewer.jsx'
import { QUESTIONS } from './slides.js'
import { makeCode, submitExam, fetchResult, checkSubmitted } from './api.js'
import { runPython } from './runner.js'

const EXAM_LIMIT_SEC = 75 * 60 // 1 hour 15 minutes

// h:mm:ss when over an hour, else mm:ss
function hms(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
}

// The whole app is a tiny screen machine:
//   welcome → exam → done   (submitting an answer)
//   welcome ⇄ result        (checking marks later)
// The anti-cheat viewer (ExamViewer) is only mounted during the exam screen.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function mmss(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ---- Welcome: collect name + email before the exam starts -------------------
function Welcome({ onStart, onResult }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [checking, setChecking] = useState(false)

  const start = async () => {
    const n = name.trim(), e = email.trim().toLowerCase()
    if (!n) return setErr('Please enter your name.')
    if (!EMAIL_RE.test(e)) return setErr('Please enter a valid email address.')
    setErr(''); setChecking(true)
    // One attempt per email: block starting if this email already submitted.
    try {
      if (await checkSubmitted(e)) {
        setChecking(false)
        return setErr('This email has already taken the exam. Only one attempt is allowed — use "View my result" below to see your marks.')
      }
    } catch {
      // If the check can't reach the server, let them start; the backend still
      // rejects a duplicate submission, so one-attempt is still guaranteed.
    }
    setChecking(false)
    onStart({ name: n, email: e })
  }

  return (
    <div className="gate">
      <div className="ambient" aria-hidden />
      <div className="gatecard">
        <aside className="gatehero" aria-hidden>
          <div className="herorings" />
          <div className="herotop">
            <span className="herologo"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M2 12 C5 6,19 6,22 12 C19 18,5 18,2 12 Z" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="12" cy="12" r="3.4" fill="#fff" /></svg></span>
            <span className="herokicker">Secure Exam</span>
          </div>
          <div className="herobody">
            <h2>Python<br />Assessment</h2>
            <p>Read the brief, write your Python, run it in the browser, and submit. Calm focus — you have one attempt.</p>
          </div>
        </aside>

        <div className="gateform">
          <div className="formhead">
            <h1>Welcome</h1>
            <p className="sub">Enter your details to begin</p>
          </div>

          <label className="field">
            <span>Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma" autoComplete="name"
              onKeyDown={(e) => e.key === 'Enter' && start()} />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && start()} />
          </label>

          {err && <div className="err">{err}</div>}

          <button className="gatebtn" onClick={start} disabled={checking}>{checking ? 'Checking…' : 'Start exam →'}</button>
          <p className="note">Your name, email, start &amp; submit times and answer are recorded. A capture attempt or leaving the window locks the question for 30 seconds.</p>
          <button className="link" onClick={onResult}>Already submitted? View my result</button>
        </div>
      </div>
    </div>
  )
}

// ---- Rules: shown after Welcome, before the exam actually starts -----------
const EXAM_RULES = [
  { icon: '🔒', title: 'One attempt only', text: 'Each email can take this exam once. You can’t restart or resubmit — so make it count.' },
  { icon: '⏱️', title: '1 hour 15 minutes', text: 'A live countdown starts the moment you begin. When it reaches zero, your answers are submitted automatically.' },
  { icon: '🚫', title: 'Stay on this tab', text: 'Leaving or switching the window restarts the exam from Question 1 and clears your answers — and the timer keeps running.' },
  { icon: '📷', title: 'No screenshots', text: 'Screen-capture attempts (PrintScreen / Snipping Tool) lock the screen. Just read and answer.' },
  { icon: '👁️', title: 'Reveal each question', text: 'Questions are scrambled. Hold the A button and Ctrl+R (or the ⊞ button) together to read them; release to re-scramble.' },
  { icon: '✅', title: 'Answer, run & submit', text: 'Write Python on the right, press ▶ Run to test it, slide between the 4 questions, then Submit. Keep the code you get to view your marks.' },
]

function Rules({ student, onProceed, onBack }) {
  return (
    <div className="gate">
      <div className="ambient" aria-hidden />
      <div className="card rulescard">
        <div className="ruleshead">
          <span className="logo"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 11l3 3L22 4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg></span>
          <div>
            <h1>Before you begin</h1>
            <p className="sub">{student?.name ? `${student.name} · ` : ''}please read the exam rules</p>
          </div>
        </div>
        <ul className="rulelist">
          {EXAM_RULES.map((r, i) => (
            <li key={i} className="ruleitem">
              <span className="ruleicon" aria-hidden>{r.icon}</span>
              <div><b>{r.title}</b><p>{r.text}</p></div>
            </li>
          ))}
        </ul>
        <button className="gatebtn" onClick={onProceed}>I understand — start exam →</button>
        <button className="link" onClick={onBack}>← Back</button>
      </div>
    </div>
  )
}

// ---- Exam: viewer + Python code editor, 1h15m countdown, tab-switch penalty --
// One shared countdown + one-time code across all questions; each question keeps
// its own code answer. A single Submit sends every answer as one submission.
// Leaving the tab restarts the exam (answers cleared) but the timer keeps going;
// at 1h15m it auto-submits and locks.
function Exam({ student, onDone, onCancel }) {
  const startedAt = useRef(Date.now())
  const code = useRef(makeCode())            // one-time code, fixed for this attempt
  const [answers, setAnswers] = useState(() => QUESTIONS.map(() => ''))
  const [outputs, setOutputs] = useState(() => QUESTIONS.map(() => null)) // {ok,output}|null per Q
  const [current, setCurrent] = useState(0)  // which question is on screen
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [running, setRunning] = useState(false) // Python is executing / loading
  const [err, setErr] = useState('')
  const [restarted, setRestarted] = useState(false) // tab-switch penalty banner
  const submittedRef = useRef(false)

  // live clock tick
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = (now - startedAt.current) / 1000
  const remaining = Math.max(0, EXAM_LIMIT_SEC - elapsed)
  const timeUp = remaining <= 0
  const low = remaining <= 300 && !timeUp // last 5 minutes → warn
  const q = QUESTIONS[current]
  const total = QUESTIONS.length
  const answeredCount = answers.filter((a) => a.trim()).length

  const setAnswer = (val) =>
    setAnswers((prev) => prev.map((a, i) => (i === current ? val : a)))

  const go = (delta) => setCurrent((c) => Math.min(total - 1, Math.max(0, c + delta)))

  // Run the current question's code in the browser (Pyodide) and show its output.
  const run = async () => {
    if (running || timeUp) return
    const code = answers[current]
    if (!code.trim()) { setErr('Write some code before running it.'); return }
    setErr(''); setRunning(true)
    setOutputs((prev) => prev.map((o, i) => (i === current ? { ok: true, output: 'Running… (first run downloads Python, ~a few seconds)' } : o)))
    try {
      const res = await runPython(code)
      setOutputs((prev) => prev.map((o, i) => (i === current ? res : o)))
    } catch (e) {
      setOutputs((prev) => prev.map((o, i) => (i === current ? { ok: false, output: String(e.message || e) } : o)))
    } finally {
      setRunning(false)
    }
  }

  const submit = async (auto = false) => {
    if (submittedRef.current) return
    if (!auto && answeredCount === 0) return setErr('Answer at least one question before submitting.')
    submittedRef.current = true
    setErr(''); setBusy(true)
    const submittedAt = Date.now()
    const durationSec = Math.round((submittedAt - startedAt.current) / 1000)
    // One cell per question (goes into its own Q1..Qn column on the sheet).
    const qcells = QUESTIONS.map((qq, i) => {
      const outText = outputs[i] ? outputs[i].output : '(not run)'
      return `# ${qq.label}\n${answers[i].trim() || '(left blank)'}\n\n--- OUTPUT ---\n${outText}`
    })
    try {
      const res = await submitExam({
        name: student.name,
        email: student.email,
        code: code.current,
        auto,
        qcells,
        startedAt: new Date(startedAt.current).toISOString(),
        durationSec,
      })
      // The server may return a different code (one stable code per email);
      // show that authoritative code, falling back to the local one.
      onDone({ code: res.code || code.current, durationSec })
    } catch (e) {
      submittedRef.current = false
      const msg = /already_submitted/.test(e.message || '')
        ? 'This email has already submitted the exam — only one attempt is allowed.'
        : (e.message || 'Could not submit. Check your connection and try again.')
      setErr(msg)
      setBusy(false)
    }
  }

  // reaching the 1h15m limit → auto-submit whatever is there, then lock
  useEffect(() => {
    if (timeUp && !submittedRef.current) submit(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp])

  // leaving the tab / window = restart the exam (answers wiped, back to Q1);
  // the timer is NOT reset, so time keeps running against them.
  useEffect(() => {
    const penalize = () => {
      if (submittedRef.current) return
      setAnswers(QUESTIONS.map(() => ''))
      setOutputs(QUESTIONS.map(() => null))
      setCurrent(0)
      setRestarted(true)
    }
    const onVis = () => { if (document.hidden) penalize() }
    window.addEventListener('blur', penalize)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('blur', penalize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <div className="examstack">
      <div className="examviewer">
        <ExamViewer key={q.id} slide={q} qIndex={current} qTotal={total} />
      </div>

      <aside className="answerbar">
        {restarted && !timeUp && (
          <div className="warnbar">
            ⚠ You left the exam tab — the exam restarted from Question 1 and your answers were cleared. The timer kept running.
            <button className="link" onClick={() => setRestarted(false)}>Dismiss</button>
          </div>
        )}
        <div className="barhead">
          <div className="qslider" style={{ '--n': total, '--i': current }}>
            <span className="qthumb" aria-hidden />
            {QUESTIONS.map((qq, i) => (
              <button key={qq.id}
                className={`qstep${i === current ? ' on' : ''}${answers[i].trim() ? ' done' : ''}`}
                onClick={() => setCurrent(i)} title={qq.label} disabled={timeUp}>
                {i + 1}{answers[i].trim() ? <span className="qmark" aria-hidden /> : null}
              </button>
            ))}
          </div>
          <div className="qtitle" key={current}>Q{current + 1}. {q.label}</div>
          <div className="barspacer" />
          <div className="who"><b>{student.name}</b><span>{student.email}</span></div>
          <div className={`timer${low ? ' low' : ''}${timeUp ? ' up' : ''}`} title="Time remaining (1h 15m limit)">
            ⏱ {timeUp ? 'Time up' : hms(remaining)}
          </div>
        </div>

        <div className={`codewrap${timeUp ? ' locked' : ''}`}>
          <CodeMirror
            value={answers[current]}
            height="100%"
            theme={oneDark}
            extensions={[python()]}
            editable={!timeUp && !busy}
            onChange={setAnswer}
            placeholder={`# Write your Python answer for "${q.label}" here\n`}
            basicSetup={{ lineNumbers: true, highlightActiveLine: !timeUp, tabSize: 4 }}
          />
        </div>

        <div className="runrow">
          <button className="runbtn" onClick={run} disabled={running || busy || timeUp}>
            {running ? '● Running…' : '▶ Run'}
          </button>
          <span className="outlabel">Output</span>
          {outputs[current] && !running && (
            <span className={`outstatus ${outputs[current].ok ? 'ok' : 'bad'}`}>
              {outputs[current].ok ? 'ran ✓' : 'error'}
            </span>
          )}
        </div>
        <pre className={`outputbox${outputs[current] && !outputs[current].ok ? ' bad' : ''}`}>
          {outputs[current] ? outputs[current].output : 'Run your code to see its output here. (First run downloads Python — a few seconds.)'}
        </pre>

        {timeUp && <div className="err">⏱ Time's up — the 1 hour 15 minute limit is over. Your answers were submitted automatically.</div>}
        {err && <div className="err">{err}</div>}

        <div className="baractions">
          <button className="navbtn" onClick={() => go(-1)} disabled={busy || timeUp || current === 0}>← Prev</button>
          <button className="navbtn" onClick={() => go(1)} disabled={busy || timeUp || current === total - 1}>Next →</button>
          <span className="answered">{answeredCount}/{total} answered</span>
          <div className="barspacer" />
          <button className="link" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="gatebtn compact" onClick={() => submit(false)} disabled={busy || timeUp}>
            {busy ? 'Submitting…' : `Submit exam (${answeredCount}/${total})`}
          </button>
        </div>
      </aside>
    </div>
  )
}

// ---- Done: show the code the student must keep -----------------------------
function Done({ code, durationSec, onResult, onRestart }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <div className="gate">
      <div className="ambient" aria-hidden />
      <div className="card">
        <div className="tick">✓</div>
        <h1>Answer submitted</h1>
        <p className="sub">Your response was recorded. Time taken: <b>{mmss(durationSec)}</b>.</p>
        <p className="note center">Save this code — you'll need it <b>with your email</b> to see your marks:</p>
        <button className="codebig" onClick={copy} title="Click to copy">
          {code}<span className="copyhint">{copied ? 'copied ✓' : 'tap to copy'}</span>
        </button>
        <button className="gatebtn" onClick={onResult}>View my result →</button>
        <button className="link" onClick={onRestart}>Back to start</button>
      </div>
    </div>
  )
}

// ---- Result: email + code → that student's marks only ----------------------
function Result({ prefill, onBack }) {
  const [email, setEmail] = useState(prefill?.email || '')
  const [code, setCode] = useState(prefill?.code || '')
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | error | not_found | ungraded | graded

  const check = async () => {
    const e = email.trim().toLowerCase(), c = code.trim().toUpperCase()
    if (!EMAIL_RE.test(e)) return setState({ status: 'error', msg: 'Enter a valid email.' })
    if (!c) return setState({ status: 'error', msg: 'Enter your one-time code.' })
    setState({ status: 'loading' })
    try {
      const r = await fetchResult(e, c)
      if (!r.found) return setState({ status: 'not_found' })
      if (!r.graded) return setState({ status: 'ungraded', name: r.name })
      setState({ status: 'graded', name: r.name, marks: r.marks, feedback: r.feedback })
    } catch (err) {
      setState({ status: 'error', msg: err.message || 'Lookup failed.' })
    }
  }

  return (
    <div className="gate">
      <div className="ambient" aria-hidden />
      <div className="card">
        <div className="cardhead">
          <span className="logo"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 10V7a6 6 0 1112 0v3" fill="none" stroke="#ffffff" strokeWidth="2" /><rect x="4" y="10" width="16" height="10" rx="2" fill="#ffffff" /></svg></span>
          <div>
            <h1>View my result</h1>
            <p className="sub">Enter the email &amp; code you used</p>
          </div>
        </div>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" onKeyDown={(e) => e.key === 'Enter' && check()} />
        </label>
        <label className="field">
          <span>One-time code</span>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="QP-XXXX" onKeyDown={(e) => e.key === 'Enter' && check()} />
        </label>

        <button className="gatebtn" onClick={check} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Checking…' : 'Check result'}
        </button>

        {state.status === 'error' && <div className="err">{state.msg}</div>}
        {state.status === 'not_found' && (
          <div className="result miss">No submission found for that email + code. Check both and try again.</div>
        )}
        {state.status === 'ungraded' && (
          <div className="result pending">
            <b>Hi {state.name} — received!</b>
            <span>Your answer is in, but it hasn't been graded yet. Check back later.</span>
          </div>
        )}
        {state.status === 'graded' && (
          <div className="result graded">
            <div className="marks"><span>Marks</span><b>{String(state.marks)}</b></div>
            {state.feedback && <div className="feedback"><span>Feedback</span><p>{state.feedback}</p></div>}
          </div>
        )}

        <button className="link" onClick={onBack}>Back to start</button>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('welcome') // welcome | rules | exam | done | result
  const [student, setStudent] = useState(null)
  const [done, setDone] = useState(null)          // { code, durationSec }

  // let the browser warn before an accidental reload/close mid-exam
  useEffect(() => {
    if (screen !== 'exam') return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [screen])

  if (screen === 'rules') {
    return (
      <Rules
        student={student}
        onProceed={() => setScreen('exam')}
        onBack={() => setScreen('welcome')}
      />
    )
  }
  if (screen === 'exam') {
    return (
      <Exam
        student={student}
        onDone={(d) => { setDone(d); setScreen('done') }}
        onCancel={() => setScreen('welcome')}
      />
    )
  }
  if (screen === 'done') {
    return (
      <Done
        code={done.code} durationSec={done.durationSec}
        onResult={() => setScreen('result')}
        onRestart={() => { setStudent(null); setDone(null); setScreen('welcome') }}
      />
    )
  }
  if (screen === 'result') {
    return (
      <Result
        prefill={{ email: student?.email, code: done?.code }}
        onBack={() => setScreen('welcome')}
      />
    )
  }
  return (
    <Welcome
      onStart={(s) => { setStudent(s); setScreen('rules') }}
      onResult={() => setScreen('result')}
    />
  )
}
