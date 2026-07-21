// Geometry, colors, fonts and text are taken VERBATIM from the PowerPoint.
// Slide is 13.333in x 7.5in; rendered on a 1280x720 canvas at 96px/in.
// (EMU / 9525 = px. 18pt text = 24px. Verified against the PPT auto-fit heights.)
export const SLIDE_W = 1280
export const SLIDE_H = 720

// Background: PPT accent6-Lighter-40% with a 90% dot pattern. The base green
// below is set so ~10% white dots average to the sampled render (#ACD392).
export const SLIDE_BG = '#A3CD86'
export const FONT_STACK = 'Calibri, "Segoe UI", system-ui, sans-serif'
export const FONT_PX = 24
export const LINE_HEIGHT = 1.2
export const TEXT_COLOR = '#000000'
export const SHAPE_OUTLINE = 'rgba(24,45,14,0.7)'

// Letter cipher (☆=A ◉=I ◇=T) kept scrambled by default; only decorative noise stripped.
const NOISE = /[○●◯◎⊙◌▶▷]/g
export function stripNoise(s) {
  return s.replace(NOISE, '')
}

// While the text toggle is held we also decode the cipher glyphs to real letters.
const CIPHER = { '☆': 'A', '◉': 'I', '◇': 'T' }
export function decode(s) {
  return stripNoise(s).replace(/[☆◉◇]/g, (ch) => CIPHER[ch] || ch)
}

export const SOCIAL_MEDIA = {
  id: 'social-media',
  index: 1,
  total: 5,
  label: 'Social Media',
  // Anti-cheat scramble: the first and last boxes stay upright; the two middle
  // blocks are flipped 180°. Holding the toggle turns every box upright to read.
  texts: [
    {
      id: 'head', x: 55.99, y: 42.28, w: 1142.86, h: 67.86, rot: 0,
      paras: ['3.SOC◉☆L MED◉☆ :', 'YOU H☆VE  ◇O CRE☆ ◇E ☆ SOC◉☆L MED◉☆ ☆PP :'],
    },
    {
      id: 'para', x: 55.99, y: 136.0, w: 1142.86, h: 155.1, rot: 180,
      paras: [
        '◉N  ◇H◉S SOC◉☆L MED◉☆ ☆PP ◉N SUCH ☆ W☆Y : ',
        '◉ ◇ SHOULD H☆S SEP☆R☆ ◇E ME ◇HOD  ◇H☆ ◇ C☆RR◉ES OU ◇ EVERY  ◇☆SK ☆ SOC◉☆L MED◉☆ C☆N DO L◉KE CRE☆ ◇E ☆CCOUN ◇ , POS ◇ ☆ND CONNEC ◇ W◉ ◇H O ◇HERS , WHERE☆S ☆NO ◇HER PROF◉LE ◉S ☆N ☆DM◉N WHO SHOULD MON◉ ◇OR ☆ND KEEP  ◇H◉NGS S ◇☆Y  ◇H☆ ◇ W☆Y ☆ND MON◉ ◇OR ◉F ☆NY REPOR ◇S ☆RE M☆DE ON ☆NY ☆CCOUN ◇.',
      ],
    },
    {
      id: 'resp', x: 55.99, y: 326.83, w: 1133.71, h: 96.94, rot: 180,
      paras: [
        '◇HERE ◉S ☆NO ◇HER RESPONS◉B◉L◉ ◇Y ◉F ☆NYONE CRE☆ ◇ES  ◇HE ☆CCOUN ◇  ◇H☆ ◇ SHOULD GO  ◇O ☆NO ◇HER ROLE KNOWN ☆S SUPER ☆DM◉N  ◇H☆ ◇ PERSON SHOULD ☆PPROVE  ◇HE CRE☆ ◇◉ON OF ☆CCOUN ◇ OF ☆NY PERSON . ',
      ],
    },
    {
      id: 'sim', x: 65.14, y: 475.42, w: 1090.28, h: 126.02, rot: 0,
      paras: [
        'S◉MUL☆ ◇E  ◇HE FOLLOW◉NG ROLES US◉NG PY ◇HON CONCEP ◇S :',
        '1.☆DM◉N', '2.SUPER ☆DM◉N', '3.USER',
      ],
    },
  ],
  // Translucent green shapes, exactly as in the PPT (text shows through them).
  // They sit on top of the text and stay put; the spotlight lifts one text box
  // above them at a time.
  shapes: [
    { id: 'noSmoking', type: 'noSmoking', x: 409.14, y: 205.71, w: 394.29, h: 356.55, fill: 'rgba(84,130,53,0.63)' },
    { id: 'cloud1', type: 'cloud', x: 774.8, y: 384.0, w: 505.14, h: 283.43, fill: 'rgba(0,176,80,0.60)' },
    { id: 'cloud2', type: 'cloud', x: 28.57, y: 33.14, w: 474.29, h: 308.57, fill: 'rgba(197,224,180,0.75)' },
  ],
}
