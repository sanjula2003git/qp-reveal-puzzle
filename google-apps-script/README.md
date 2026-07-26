# Exam backend — Google Sheet + Apps Script

The puzzle stores every submission as a row in a Google Sheet **you own**, and you
grade by typing marks into that Sheet. There is **no server to host** — a Google
Apps Script bound to the Sheet is the whole backend. Free and persistent.

```
Student app  ──POST answer──▶  Apps Script (/exec)  ──appends row──▶  Google Sheet
Student app  ──GET email+code─▶ Apps Script (/exec)  ◀──reads marks──   (you graded)
```

## One-time setup (~5 minutes)

1. **Create a Google Sheet** — this is your gradebook. Name it anything.
2. In that Sheet: **Extensions → Apps Script**.
3. Delete the sample code, paste the contents of [`Code.gs`](./Code.gs), and **Save**.
4. **Deploy → New deployment**. Click the gear ⚙ → **Web app**.
   - **Description:** QP exam backend
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`  ← required so students' browsers can reach it
   - Click **Deploy**, authorise when prompted, and **copy the Web app URL**
     (it ends in `/exec`).
5. In the app folder, copy `.env.example` to `.env.local` and set:
   ```
   VITE_QP_ENDPOINT=<the /exec URL you copied>
   ```
   Restart `npm run dev` (or set the same variable in your Vercel/host build env
   and redeploy).

The script auto-creates a **`Submissions`** tab with these columns (each question's
code + output lands in its own **Q1–Q4** column):

| Submitted At | Name | Email | Code | Started At | Duration (s) | Q1 | Q2 | Q3 | Q4 | **Marks** | **Feedback** | Graded At |
|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Grading

Open the Sheet and type into the **Marks** column (and optionally **Feedback**) on
a student's row. That's it — nothing to redeploy.

- **Marks filled in** → the student sees the number + feedback on their result screen.
- **Marks blank** → the student sees "received, not graded yet."

Only a row whose **Email _and_ Code** both match is ever returned, so each student
sees only their own result.

## Editing the script later

If you change `Code.gs`, re-publish: **Deploy → Manage deployments → ✏️ (edit) →
Version: New version → Deploy**. The `/exec` URL stays the same, so you don't need
to touch `.env`.

## Notes / limits

- The `/exec` URL is public by design (students' browsers call it directly).
  Retrieval is gated by the one-time code, which is enough for a classroom exam —
  it is not bank-grade auth.
- Requests are sent as `text/plain` on purpose: it keeps them "simple" CORS
  requests so the browser skips the preflight that Apps Script can't answer.
- Free Apps Script quotas are generous (thousands of calls/day) — fine for a class.
