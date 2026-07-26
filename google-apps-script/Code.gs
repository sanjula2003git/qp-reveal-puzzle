/**
 * QP Reveal Puzzle — exam backend.
 *
 * This is a Google Apps Script bound to the Google Sheet that stores submissions.
 * It exposes two actions to the frontend:
 *   • POST {action:'submit', ...}  → append a submission row
 *   • GET  ?action=result&email=&code= → return that one student's marks/feedback
 *
 * SETUP (once):
 *   1. Create a Google Sheet (this becomes your gradebook).
 *   2. Extensions → Apps Script. Delete the sample, paste this file, Save.
 *   3. Deploy → New deployment → type "Web app".
 *        Execute as: Me      Who has access: Anyone
 *      Copy the Web app URL (ends in /exec).
 *   4. Put that URL in the frontend's .env as VITE_QP_ENDPOINT, then rebuild/redeploy.
 *
 * GRADING: open the Sheet, type a number in the "Marks" column (and optional
 * "Feedback") on a student's row. That's all — the student sees it on their
 * result screen. Leave Marks blank and they see "Not graded yet".
 *
 * After editing this script you must re-publish: Deploy → Manage deployments →
 * (pencil) → Version: New version → Deploy. The /exec URL stays the same.
 */

var SHEET_NAME = 'Submissions'
// Each question gets its own column (Q1..Q4), holding that question's code + output.
var HEADERS = [
  'Submitted At', 'Name', 'Email', 'Code', 'Started At', 'Duration (s)',
  'Slide 1 Answer', 'Slide 2 Answer', 'Slide 3 Answer', 'Slide 4 Answer',
  'Marks', 'Feedback', 'Graded At',
]
// Column indexes (0-based) into a row — keep in sync with HEADERS above.
var COL = { at: 0, name: 1, email: 2, code: 3, started: 4, duration: 5,
            q1: 6, q2: 7, q3: 8, q4: 9, marks: 10, feedback: 11, gradedAt: 12 }

// One stable code per email: return the code this email already used, or '' if new.
function findCodeForEmail_(email) {
  var rows = sheet_().getDataRange().getValues()
  for (var i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][COL.email]).trim().toLowerCase() === email) {
      return String(rows[i][COL.code]).trim().toUpperCase()
    }
  }
  return ''
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName(SHEET_NAME)
  if (!sh) sh = ss.insertSheet(SHEET_NAME)
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS)
    sh.setFrozenRows(1)
  }
  return sh
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  var lock = LockService.getScriptLock()
  try {
    lock.waitLock(10000) // serialise appends so concurrent submits don't collide
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    if (body.action !== 'submit') return json_({ ok: false, error: 'unknown action' })

    var name = String(body.name || '').trim()
    var email = String(body.email || '').trim().toLowerCase()
    var code = String(body.code || '').trim().toUpperCase()
    if (!name || !email || !code) return json_({ ok: false, error: 'missing name, email or code' })

    // One attempt per email: if this email already has a submission, reject the
    // new one outright so nobody can retake or overwrite their exam.
    if (findCodeForEmail_(email)) {
      return json_({ ok: false, error: 'already_submitted' })
    }

    var qc = body.qcells || []  // one string per question (code + output)
    sheet_().appendRow([
      new Date(),                                  // Submitted At
      name,                                        // Name
      email,                                       // Email
      code,                                        // Code
      body.startedAt ? new Date(body.startedAt) : '', // Started At
      Number(body.durationSec || 0),               // Duration (s)
      String(qc[0] || ''),                         // Q1
      String(qc[1] || ''),                         // Q2
      String(qc[2] || ''),                         // Q3
      String(qc[3] || ''),                         // Q4
      '', '', '',                                  // Marks, Feedback, Graded At (teacher fills these)
    ])
    // Return the code actually stored so the frontend shows the authoritative,
    // per-email code (which may differ from what the client generated).
    return json_({ ok: true, code: code })
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  } finally {
    try { lock.releaseLock() } catch (ignore) {}
  }
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {}

    // Has this email already submitted? Used by the welcome screen to block a
    // second attempt before the student even starts.
    if (p.action === 'check') {
      var cEmail = String(p.email || '').trim().toLowerCase()
      if (!cEmail) return json_({ ok: false, error: 'missing email' })
      return json_({ ok: true, submitted: !!findCodeForEmail_(cEmail) })
    }

    if (p.action !== 'result') return json_({ ok: false, error: 'unknown action' })

    var email = String(p.email || '').trim().toLowerCase()
    var code = String(p.code || '').trim().toUpperCase()
    if (!email || !code) return json_({ ok: false, error: 'missing email or code' })

    var rows = sheet_().getDataRange().getValues()
    // Walk newest → oldest so a resubmission wins over an earlier attempt.
    for (var i = rows.length - 1; i >= 1; i--) {
      var r = rows[i]
      if (String(r[COL.email]).trim().toLowerCase() === email &&
          String(r[COL.code]).trim().toUpperCase() === code) {
        var marks = r[COL.marks]
        var graded = marks !== '' && marks !== null && marks !== undefined
        return json_({
          ok: true, found: true, graded: graded,
          name: r[COL.name],
          marks: graded ? marks : null,
          feedback: graded ? String(r[COL.feedback] || '') : '',
          submittedAt: r[COL.at] ? new Date(r[COL.at]).toISOString() : null,
        })
      }
    }
    return json_({ ok: true, found: false })
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  }
}
