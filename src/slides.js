// Geometry, colors, fonts and text are taken VERBATIM from the PowerPoint
// (C:\Users\fersa\Documents\SHR◉R☆M ☆◉ B☆.pptx).
// Slide is 13.333in x 7.5in; rendered on a 1280x720 canvas at 96px/in.
// (EMU / 9525 = px. 18pt text = 24px. Verified against the PPT auto-fit heights.)
export const SLIDE_W = 1280
export const SLIDE_H = 720

// Default background (Social Media): PPT accent6-Lighter-40% with a 90% dot
// pattern. The base green below is set so ~10% white dots average to the
// sampled render (#ACD392). Other slides carry their own `bg` (see below).
export const SLIDE_BG = '#A3CD86'
export const FONT_STACK = 'Calibri, "Segoe UI", system-ui, sans-serif'
export const FONT_PX = 24
export const LINE_HEIGHT = 1.2
export const TEXT_COLOR = '#000000'
export const SHAPE_OUTLINE = 'rgba(24,45,14,0.7)'

// Letter cipher (☆=A ◉=I ◇=T ⚀=1) kept scrambled by default; decorative noise
// glyphs (○●◯◉... runs) are dropped when the deck is transcribed below, and the
// remaining "▶▷" style noise is stripped at render time.
const NOISE = /[○●◯◎⊙◌▶▷]/g
export function stripNoise(s) {
  return s.replace(NOISE, '')
}

// While the text toggle is held we also decode the cipher glyphs to real letters.
const CIPHER = { '☆': 'A', '◉': 'I', '◇': 'T', '⚀': '1' }
export function decode(s) {
  return stripNoise(s)
    // The PPT typed the "T" cipher (◇) with a stray space before it inside words
    // (e.g. "CRE☆ ◇E" → CREATE). Real word breaks use a double space, in-word
    // splits a single one — so drop exactly ONE space immediately before each ◇,
    // then collapse any leftover runs of spaces.
    .replace(/ (?=◇)/g, '')
    .replace(/[☆◉◇⚀]/g, (ch) => CIPHER[ch] || ch)
    .replace(/ {2,}/g, ' ')
    .trim()
}

// Per-slide background recipes (CSS). color + optional pattern image/size/pos.
const BG_DOTS = {
  color: '#A3CD86',
  image: 'radial-gradient(circle, rgba(255,255,255,0.8) 0.85px, transparent 1.15px)',
  size: '7px 7px',
}
const BG_CHECK = { // Zepto — lgCheck, blue on white
  color: '#ffffff',
  image: 'linear-gradient(45deg, rgba(68,114,196,.20) 25%, transparent 25%),' +
    'linear-gradient(-45deg, rgba(68,114,196,.20) 25%, transparent 25%),' +
    'linear-gradient(45deg, transparent 75%, rgba(68,114,196,.20) 75%),' +
    'linear-gradient(-45deg, transparent 75%, rgba(68,114,196,.20) 75%)',
  size: '52px 52px',
  position: '0 0, 0 26px, 26px -26px, -26px 0',
}
const BG_DIAG = { // Blackhole — dashDnDiag, dark gold dashes on light blue
  color: '#bcd4ec',
  image: 'repeating-linear-gradient(315deg, rgba(127,96,0,.35) 0 3px, transparent 3px 13px)',
  size: 'auto',
}
const BG_GRID = { // UNO — smGrid, orange grid on warm grey
  color: '#d9d4cb',
  image: 'linear-gradient(rgba(177,92,34,.22) 1px, transparent 1px),' +
    'linear-gradient(90deg, rgba(177,92,34,.22) 1px, transparent 1px)',
  size: '22px 22px',
}

// ---------------------------------------------------------------------------
// Slide 2 — Social Media
// ---------------------------------------------------------------------------
export const SOCIAL_MEDIA = {
  id: 'social-media',
  label: 'Social Media',
  bg: BG_DOTS,
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
  shapes: [
    { id: 'noSmoking', type: 'noSmoking', x: 409.14, y: 205.71, w: 394.29, h: 356.55, fill: 'rgba(84,130,53,0.63)' },
    { id: 'cloud1', type: 'cloud', x: 774.8, y: 384.0, w: 505.14, h: 283.43, fill: 'rgba(0,176,80,0.60)' },
    { id: 'cloud2', type: 'cloud', x: 28.57, y: 33.14, w: 474.29, h: 308.57, fill: 'rgba(197,224,180,0.75)' },
  ],
}

// ---------------------------------------------------------------------------
// Slide 3 — Zepto (instant delivery / perfect number)
// ---------------------------------------------------------------------------
export const ZEPTO = {
  id: 'zepto',
  label: 'Zepto',
  bg: BG_CHECK,
  texts: [
    { id: 'head', x: 78.86, y: 52.57, w: 1137.14, h: 38.77, rot: 0,
      paras: ['⚀.ZEP ◇O (◉NS ◇☆N ◇ DEL◉VERY)'] },
    { id: 'scen', x: 78.86, y: 116.57, w: 1044.57, h: 38.77, rot: 0,
      paras: ['SCEN☆R◉O : YOU ☆RE S☆◉D  ◇O BUY SOME  ◇H◉NG BY YOUR MO ◇HER .  ◇HE  ◇H◉NGS ☆RE :'] },
    { id: 'list', x: 78.86, y: 180.57, w: 1052.57, h: 126.02, rot: 0,
      paras: ['◇URMER◉C ⚀00 GMS', 'ON◉ON ⚀ KG', 'COR◉☆NDER', 'PHONE CH☆RGER'] },
    { id: 'task', x: 78.86, y: 331.86, w: 1078.86, h: 184.18, rot: 180,
      paras: ['◇☆SK : YOU H☆VE  ◇O BUY  ◇HESE ◉ ◇EMS E☆CH ONLY ONE QU☆N ◇◉ ◇Y ☆ND GE ◇  ◇HE  ◇O ◇☆L ◉N ☆ PERFEC ◇ NUMBER , YOU C☆N USE ☆NY BR☆ND .  ◇HE  ◇O ◇☆L SHOULD BE EXCLUD◉NG  ◇HE GS ◇  ◇☆XES ☆ND EVERY ◇H◉NG . FOR EX☆MPLE ◉F 50 ◉S PERFEC ◇ NUMBER 50 ◉S  ◇HE  ◇O ◇☆L W◉ ◇HOU ◇ ☆DD◉NG GS ◇  ◇☆XES ☆F ◇ER ☆DD◉NG GS ◇ ◉ ◇ W◉LL BE 6⚀. SO BEFORE ☆DD◉NG GS ◇  ◇HE  ◇O ◇☆L SHOULD BE PERFEC ◇ NUMBER BU ◇ O ◇HER CH☆RGES C☆N BE ◉NCLUDED'] },
  ],
  shapes: [
    { id: 'e1', type: 'ellipse', x: 4.57, y: 91.35, w: 514.28, h: 554.37, fill: 'rgba(143,170,220,0.588)' },
    { id: 'e2', type: 'ellipse', x: 350.85, y: 74.28, w: 518.86, h: 539.43, fill: 'rgba(47,85,151,0.651)' },
    { id: 'e3', type: 'ellipse', x: 761.14, y: 74.28, w: 518.86, h: 552.0, fill: 'rgba(68,114,196,0.859)' },
  ],
}

// ---------------------------------------------------------------------------
// Slide 4 — Blackhole (spacetech)
// ---------------------------------------------------------------------------
export const BLACKHOLE = {
  id: 'blackhole',
  label: 'Blackhole',
  bg: BG_DIAG,
  texts: [
    { id: 'head', x: 73.14, y: 53.71, w: 1137.14, h: 96.94, rot: 0,
      paras: [
        '3.BL☆CKHOLE (SP☆CETECH) ',
        'YOU W◉LL BE SP☆CETECH ENTHUS◉☆ST WHO W◉LL M☆KE OTHERS UNDERST☆ND WH☆TS UNDER BL☆CKHOLE ☆ND WH☆T ◉T S☆YS ',
      ] },
    { id: 'details', x: 73.14, y: 150.65, w: 1107.43, h: 300.51, rot: 0,
      paras: [
        'YOU H☆VE TO DETERM◉NE WHETHER THE G◉VEN DET☆◉LS OF BL☆CKHOLE ◉S D☆NGEROUS FOR US OR NOT ',
        'HERE ◉N TH◉S YOU H☆VE TO GET FOLLOW◉NG DET☆◉LS :',
        '1.ST☆R D◉ST☆NCE ',
        '2.GR☆V◉TY ◉NTENS◉TY ',
        '3.OUR ☆TMOSPHERE STRENGTH',
        '4.HOW M☆NY PL☆NETS NE☆RBY OUR E☆RTH H☆S BEEN T☆KEN BY ◉T ',
        '5.HOW ◉S ◉T F☆R ◉S ◉T FROM OUR SUN',
      ] },
    { id: 'rules', x: 69.71, y: 449.14, w: 1066.29, h: 300.51, rot: 0,
      paras: [
        'NOW YOU H☆VE TO DETERM◉NE WHETHER ◉T ◉S F☆T☆L OR NOT BY FOLLOW◉NG RULES:',
        'ST☆R D◉ST☆NCE SHOULD BE BETWEEN 56 L◉GHT YE☆RS TO 78 L◉GHT YE☆RS ',
        'GR☆V◉TY ◉NTENS◉TY SHOULD BETWEEN 67 M/S TO 92 M/S',
        'OUR ☆TMOSPHERE STRENGTH SHOULD BE H◉GH ☆ND PL☆NETS NE☆RBY SHOULD BE  ☆ROUND 0 (TH◉S ◉S VERY ◉MPORT☆NT COND◉T◉ON ) ☆ND F☆R FROM SHOULD BE 45 L◉GHT YE☆RS.',
      ] },
  ],
  shapes: [
    { id: 'cloud1', type: 'cloud', x: 17.14, y: 26.28, w: 594.28, h: 291.43, fill: 'rgba(89,89,89,0.588)' },
    { id: 'cloud2', type: 'cloud', x: 630.96, y: 16.0, w: 576.0, h: 291.43, fill: 'rgba(89,89,89,0.780)' },
    { id: 'bolt3', type: 'lightningBolt', x: 360.0, y: 339.9, w: 522.73, h: 323.43, rot: 14.35, fill: 'rgb(191,144,0)' },
    { id: 'bolt1', type: 'lightningBolt', x: 124.13, y: 340.08, w: 419.08, h: 344.0, rot: 13.03, fill: 'rgba(191,144,0,0.839)' },
    { id: 'bolt2', type: 'lightningBolt', x: 666.73, y: 345.98, w: 490.29, h: 326.46, rot: 13.03, fill: 'rgba(191,144,0,0.812)' },
  ],
}

// ---------------------------------------------------------------------------
// Slide 5 — UNO cards
// ---------------------------------------------------------------------------
export const UNO = {
  id: 'uno',
  label: 'UNO Cards',
  bg: BG_GRID,
  texts: [
    { id: 'head', x: 45.71, y: 57.14, w: 1158.86, h: 96.94, rot: 0,
      paras: [
        '2.UNO C☆RDS ',
        'CONS◉DER YOU ☆RE OBSERV◉NG  ◇HE G☆ME FROM OU ◇S◉DE ☆ND  ◇H☆ ◇ G☆ME H☆S 3 PL☆YERS :',
      ] },
    { id: 'scen', x: 45.71, y: 154.08, w: 1128.0, h: 213.26, rot: 180,
      paras: [
        ' ◇HE SCEN☆R◉O :',
        'HERE  ◇HE  ◇HREE PL☆YERS ☆RE PL☆Y◉NG  ◇OGE ◇HER ☆ND HERE PL☆YER  ◇HERE  ◇HREE W◉ ◇H N☆M◉NG ☆,B,C .',
        'PL☆YER ☆ H☆S 3 C☆RDS ☆ND PL☆YER H☆S 8 C☆RDS ☆ND PL☆YER C H☆S 2 C☆RDS . ☆S  ◇HEY WERE PL☆Y◉NG  ◇HEY H☆D ☆ S ◇☆CK OF C☆RDS R◉GH ◇ ? . NOW CONS◉DER  ◇H☆ ◇ DECK H☆S 12 C☆RDS ☆ND 5 RED COLOUR C☆RD ◉S  ◇HERE . FROM  ◇H☆ ◇ 5 RED YOU H☆VE  ◇O BU◉LD ☆ DECK.',
      ] },
    { id: 'deck', x: 57.14, y: 379.43, w: 1092.57, h: 96.94, rot: 0,
      paras: ['◉N  ◇H☆ ◇ DECK  ◇HERE SHOULD BE 12 MORE C☆RDS ☆ND 3 OF  ◇HE PL☆YERS SHOULD PL☆Y ☆ND ☆LSO  ◇HE F◉N☆L C☆RD SHOULD BE YELLOW 3 .'] },
    { id: 'sim', x: 73.14, y: 505.14, w: 1092.57, h: 67.86, rot: 0,
      paras: ['YOU H☆VE  ◇O S◉MUL☆ ◇E  ◇HE ☆BOVE G◉VEN G☆ME US◉NG PY ◇HON CONCEP ◇S .'] },
  ],
  shapes: [
    { id: 'c1', type: 'chevron', x: 115.43, y: 67.43, w: 369.11, h: 548.57, fill: 'rgba(244,177,131,0.761)' },
    { id: 'c2', type: 'chevron', x: 414.86, y: 75.43, w: 358.86, h: 532.57, fill: 'rgba(248,203,173,0.6)' },
    { id: 'c3', type: 'chevron', x: 726.29, y: 57.14, w: 315.43, h: 548.57, fill: 'rgba(177,92,34,0.44)' },
  ],
}

// The exam, in slide order (the deck's title slide is the app banner).
export const QUESTIONS = [SOCIAL_MEDIA, ZEPTO, BLACKHOLE, UNO]
