// In-browser Python execution via Pyodide (CPython compiled to WebAssembly).
// Loaded lazily from the CDN the first time a student clicks Run (~6MB once).
const PYODIDE_VERSION = 'v0.27.2'
const BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

let pyodidePromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-pyodide]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.dataset.pyodide = '1'
    s.onload = resolve
    s.onerror = () => reject(new Error('Could not load Python (Pyodide). Check your connection.'))
    document.head.appendChild(s)
  })
}

// Kicks off the (one-time) download+init. Safe to call repeatedly.
export function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(BASE + 'pyodide.js')
      const py = await window.loadPyodide({ indexURL: BASE })
      return py
    })().catch((e) => { pyodidePromise = null; throw e }) // allow retry on failure
  }
  return pyodidePromise
}

// True once Pyodide has finished loading at least once (for UI hints).
export let pyodideReady = false
getPyodide.markReady = () => { pyodideReady = true }

// Run `code`, capturing everything it prints (stdout + stderr) plus any error.
// Returns { ok, output }.
export async function runPython(code) {
  const py = await getPyodide()
  pyodideReady = true
  let buf = ''
  py.setStdout({ batched: (s) => { buf += s + '\n' } })
  py.setStderr({ batched: (s) => { buf += s + '\n' } })
  try {
    await py.runPythonAsync(code)
    return { ok: true, output: buf.replace(/\n+$/, '') || '(ran successfully — no output)' }
  } catch (e) {
    const msg = String(e && e.message ? e.message : e)
    return { ok: false, output: (buf + msg).replace(/\n+$/, '') }
  }
}
