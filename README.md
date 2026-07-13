# Python Question Bank — Reveal Puzzle

An interactive React app that recreates the obfuscated question-paper slides.
Each question is hidden three ways (a letter cipher, rotated text, and shapes on
top). The student uncovers it by interacting:

- **👁 Eye button** — click to rotate the flipped text upright (a few clicks).
- **Ctrl + R** — moves the overlapping shapes off the text to reveal it.
- **Move the cursor off the sheet** — everything snaps back to hidden.
- **🔊 Play instructions** — spoken narration (your own recording if you add
  `public/narration.mp3`, otherwise the browser voice).

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Build / deploy

```bash
npm run build   # outputs to dist/
```

Deploys as a static site (e.g. Vercel), same as the other versions in this repo.

## Add your voice

Drop `narration.mp3` into `public/` — see `public/NARRATION.txt` for the script.

## Notes

- Slide geometry (positions, sizes, rotations, text) is lifted directly from the
  PowerPoint and lives in `src/slides.js`.
- The `☆ = A · ◉ = I · ◇ = T` letter cipher is kept on purpose; only the
  decorative "noise" glyphs are stripped (`stripNoise` in `src/slides.js`).
- This first pass ships **one slide** (Social Media). The engine is reusable —
  the other four slides drop into the same `slides.js` shape.
