// Talks to the Google Apps Script web app that is bound to the responses Sheet.
// The endpoint URL (…/exec) is injected at build time via VITE_QP_ENDPOINT.
// See google-apps-script/README.md for the one-time setup.
const ENDPOINT = import.meta.env.VITE_QP_ENDPOINT || ''

// A short, human-friendly one-time code the student keeps to retrieve their marks.
// Ambiguous characters (0/O, 1/I) are left out so it's easy to write down.
export function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return 'QP-' + s
}

// Append a submission row. We send text/plain so the browser treats this as a
// "simple" request and skips the CORS preflight — Apps Script has no OPTIONS
// handler, so a preflighted application/json POST would fail.
export async function submitExam(payload) {
  if (!ENDPOINT) throw new Error('Exam endpoint not configured (set VITE_QP_ENDPOINT).')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'submit', ...payload }),
    redirect: 'follow',
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Submit failed')
  return data
}

// Has this email already submitted the exam? Used to enforce one attempt per
// email — the welcome screen calls this before letting a student start.
export async function checkSubmitted(email) {
  if (!ENDPOINT) throw new Error('Exam endpoint not configured (set VITE_QP_ENDPOINT).')
  const url = `${ENDPOINT}?action=check&email=${encodeURIComponent(email)}`
  const res = await fetch(url, { method: 'GET', redirect: 'follow' })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Check failed')
  return !!data.submitted
}

// Look up a student's result by email + their one-time code. Only a row that
// matches BOTH is ever returned, so a student only sees their own marks.
export async function fetchResult(email, code) {
  if (!ENDPOINT) throw new Error('Exam endpoint not configured (set VITE_QP_ENDPOINT).')
  const url = `${ENDPOINT}?action=result&email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  const res = await fetch(url, { method: 'GET', redirect: 'follow' })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Lookup failed')
  return data
}
