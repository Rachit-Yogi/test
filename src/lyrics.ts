// ---------------------------------------------------------------------------
// Lyric cues, their meaning, and the visual language chosen for each.
//
// Timing is expressed in BEATS from the first lyric (beat 0 = the kick nearest
// 0:25). 1 beat = 60 / 118.05 s. To nudge a line, change `startBeat`; the next
// line's start is the end of this one. These timings were estimated from the
// beat grid and the energy of the track (not forced-aligned to the vocal), so
// expect to retune a few by ear in Remotion Studio.
// ---------------------------------------------------------------------------

export type TransitionKind =
  | 'zPull'
  | 'zPush'
  | 'flipX'
  | 'flipY'
  | 'whipLeft'
  | 'whipRight'
  | 'whipUp'
  | 'whipDown'
  | 'match';

export type WordFx = 'none' | 'wave' | 'stretch' | 'glitch' | 'bloom' | 'pulse' | 'slam';

export type Theme = 'dust' | 'stars' | 'rain' | 'petals' | 'sparks' | 'hearts';

export type SceneFx =
  | 'aura'
  | 'bokeh'
  | 'sparkle'
  | 'speedUp'
  | 'speedLeft'
  | 'flare'
  | 'rays'
  | 'heart'
  | 'focus'
  | 'rgbTear'
  | 'scanlines'
  | 'invertFlash'
  | 'bigShock';

export type Burst = 'shatter' | 'sparks' | 'petals' | 'confetti';

export type PaletteName =
  | 'celestial'
  | 'gaze'
  | 'motion'
  | 'impact'
  | 'tender'
  | 'dew'
  | 'heart'
  | 'divine'
  | 'sky'
  | 'bloom'
  | 'finale';

export type PaletteDef = {
  c1: string;
  c2: string;
  c3: string;
  accent: string;
  base: string;
};

export const PALETTES: Record<PaletteName, PaletteDef> = {
  celestial: {c1: '#ff4fd8', c2: '#6a4cff', c3: '#22d3ee', accent: '#ffe9a8', base: '#12041f'},
  gaze: {c1: '#2b6bff', c2: '#00d4c8', c3: '#ff3d81', accent: '#a8f4ff', base: '#04102a'},
  motion: {c1: '#ff7a1a', c2: '#ff2a4d', c3: '#5a1cff', accent: '#fff1a8', base: '#170514'},
  impact: {c1: '#ff1744', c2: '#ff9100', c3: '#7a00ff', accent: '#ffffff', base: '#0c0010'},
  tender: {c1: '#ff8fb8', c2: '#ffb37a', c3: '#8a6cff', accent: '#fff3d1', base: '#1a0620'},
  dew: {c1: '#31e0c7', c2: '#2b7bff', c3: '#b2ffe6', accent: '#e6fffb', base: '#03162a'},
  heart: {c1: '#ff2457', c2: '#ff6fae', c3: '#7a0a4a', accent: '#ffd6e6', base: '#18020f'},
  divine: {c1: '#ffc93c', c2: '#ff8a00', c3: '#6a2cff', accent: '#fff6cc', base: '#120628'},
  sky: {c1: '#5ac8fa', c2: '#af52de', c3: '#ff9ecb', accent: '#ffffff', base: '#07102a'},
  bloom: {c1: '#3dd68c', c2: '#ff6bb5', c3: '#ffe14d', accent: '#ffffff', base: '#04160f'},
  finale: {c1: '#ff4fa3', c2: '#ffd23f', c3: '#3ddc97', accent: '#fffbe6', base: '#12041a'},
};

export type WordCfg = {
  t: string;
  face: 'heavy' | 'italic';
  /** Emphasised word: gets the line's `hotFx`, stronger glow and RGB split. */
  hot?: boolean;
  /** Pinned across a match-cut: stays put while the other words shatter/orbit. */
  anchor?: boolean;
};

export type Row = {
  words: WordCfg[];
  /** Optional vertical offset (px from centre) to pin a row across a match-cut. */
  y?: number;
};

export type LyricLine = {
  id: string;
  text: string;
  /** English gloss, used to pick the visual language. */
  meaning: string;
  /** Why these effects were chosen. */
  why: string;
  startBeat: number;
  /** How this line enters (and how the previous line leaves). */
  enter: TransitionKind;
  palette: PaletteName;
  theme: Theme;
  fx: SceneFx[];
  hotFx: WordFx;
  baseFx?: WordFx;
  burst?: Burst;
  rows: Row[];
};

const H = (t: string, extra: Partial<WordCfg> = {}): WordCfg => ({t, face: 'heavy', ...extra});
const I = (t: string, extra: Partial<WordCfg> = {}): WordCfg => ({t, face: 'italic', ...extra});

export const LYRICS: LyricLine[] = [
  {
    id: 'l01',
    text: 'Qaabil-E-Taareef Tu Apsaraaon Jaisi',
    meaning: 'Worthy of all praise, you are like the celestial nymphs',
    why: 'Praise + heavenly beings = euphoric/melodic: neon aura, floating bokeh, twinkling stars, liquid wave type.',
    startBeat: 0,
    enter: 'zPull',
    palette: 'celestial',
    theme: 'stars',
    fx: ['aura', 'bokeh', 'sparkle'],
    hotFx: 'wave',
    baseFx: 'wave',
    rows: [
      {words: [H('QAABIL-E-')]},
      {words: [H('TAAREEF', {hot: true})]},
      {words: [I('tu')]},
      {words: [H('APSARAAON', {hot: true})]},
      {words: [I('jaisi')]},
    ],
  },
  {
    id: 'l02',
    text: 'Hoo-Bahoo Dikhe Nigaahon Ko Tu',
    meaning: 'You appear exactly as you are, right in my eyes',
    why: 'Eyes and gaze: concentric focus rings pull inward, a 3D flip turns the view, the iris word pulses with the kick.',
    startBeat: 8,
    enter: 'flipY',
    palette: 'gaze',
    theme: 'dust',
    fx: ['aura', 'focus'],
    hotFx: 'bloom',
    rows: [
      {words: [H('HOO-BAHOO')]},
      {words: [I('dikhe')]},
      {words: [H('NIGAAHON', {hot: true, anchor: true})]},
      {words: [I('ko tu')]},
    ],
  },
  {
    id: 'l03',
    text: 'Koo-Ba-Koo Tera Asar Hardam Mere Roo-Ba-Roo',
    meaning: 'Street by street, your spell is always upon me',
    why: 'Movement and "everywhere": horizontal speed lines, a whip-pan, a lens flare sweeping across, stretched kinetic type.',
    startBeat: 16,
    enter: 'whipLeft',
    palette: 'motion',
    theme: 'sparks',
    fx: ['speedLeft', 'flare'],
    hotFx: 'stretch',
    baseFx: 'stretch',
    rows: [
      {words: [H('KOO-BA-KOO')]},
      {words: [I('tera'), H('ASAR', {hot: true})]},
      {words: [H('HARDAM')]},
      {words: [I('mere'), H('ROO-BA-ROO')]},
    ],
  },
  {
    id: 'l04',
    text: 'Mehbooba Main Deewana',
    meaning: 'Beloved, I am the madly in love one',
    why: 'Obsession and madness = high energy: slam scale, screen shake, inverted-colour flash, shattering glass, RGB tears, scanlines.',
    startBeat: 28,
    enter: 'zPush',
    palette: 'impact',
    theme: 'sparks',
    fx: ['invertFlash', 'rgbTear', 'scanlines', 'bigShock'],
    hotFx: 'slam',
    burst: 'shatter',
    rows: [
      {words: [H('MEHBOOBA')]},
      {words: [I('main')]},
      {words: [H('DEEWANA', {hot: true})]},
    ],
  },
  {
    id: 'l05',
    text: 'I Just Wanna Tell You Jaana',
    meaning: 'I just want to tell you, my darling',
    why: 'A tender confession: smooth spring bounce, soft aura and bokeh, floating hearts.',
    startBeat: 34,
    enter: 'flipX',
    palette: 'tender',
    theme: 'hearts',
    fx: ['aura', 'bokeh'],
    hotFx: 'bloom',
    rows: [
      {words: [I('i'), I('just'), I('wanna')]},
      {words: [H('TELL YOU')]},
      {words: [H('JAANA', {hot: true})]},
    ],
  },
  {
    id: 'l06',
    text: 'Teri Adaaon Ke Qatre Shabnami',
    meaning: 'The dewy droplets of your charms',
    why: 'Dew and droplets: falling water particles, a whip-pan from above like a drop falling, liquid wave physics on "shabnami".',
    startBeat: 42,
    enter: 'whipDown',
    palette: 'dew',
    theme: 'rain',
    fx: ['aura'],
    hotFx: 'wave',
    rows: [
      {words: [I('teri'), H('ADAAON')]},
      {words: [I('ke'), H('QATRE', {hot: true})]},
      {words: [H('SHABNAMI', {hot: true})]},
    ],
  },
  {
    id: 'l07',
    text: 'Dilruba Dilnasheen',
    meaning: 'Stealer of hearts, dweller in the heart',
    why: 'The heart itself: a giant heart pulses with every kick behind the words, hearts rise through the frame.',
    startBeat: 50,
    enter: 'flipY',
    palette: 'heart',
    theme: 'hearts',
    fx: ['heart', 'aura'],
    hotFx: 'pulse',
    baseFx: 'pulse',
    rows: [
      {words: [H('DILRUBA', {hot: true})]},
      {words: [H('DILNASHEEN', {hot: true})]},
    ],
  },
  {
    id: 'l08',
    text: 'Ba-Khuda Tu Haseen',
    meaning: 'By God, you are beautiful',
    why: 'An oath to the divine: golden god-rays burst out, a lens flare, a heavy slam, sparks.',
    startBeat: 56,
    enter: 'zPush',
    palette: 'divine',
    theme: 'stars',
    fx: ['rays', 'flare', 'bigShock'],
    hotFx: 'slam',
    burst: 'sparks',
    rows: [
      {words: [H('BA-KHUDA', {hot: true})]},
      {words: [I('tu')]},
      {words: [H('HASEEN')]},
    ],
  },
  {
    id: 'l09',
    text: 'Tere Jaisi Hoor Na Koi',
    meaning: 'There is no heavenly fairy like you',
    why: 'A hoor floats above: upward speed lines, a rising whip-pan, stretched type, sparkles.',
    startBeat: 62,
    enter: 'whipUp',
    palette: 'sky',
    theme: 'stars',
    fx: ['speedUp', 'flare', 'sparkle'],
    hotFx: 'stretch',
    rows: [
      {words: [I('tere jaisi')]},
      {words: [H('HOOR', {hot: true})]},
      {words: [H('NA KOI')]},
    ],
  },
  {
    id: 'l10',
    text: 'Tum Mile Gul Khile',
    meaning: 'When you came, the flowers bloomed',
    why: 'Blooming: petals burst out, the anchor "GUL KHILE" swells with the beat, a 3D flip opens the line like a flower.',
    startBeat: 68,
    enter: 'flipX',
    palette: 'bloom',
    theme: 'petals',
    fx: ['aura', 'sparkle'],
    hotFx: 'bloom',
    burst: 'petals',
    rows: [
      {y: -190, words: [H('TUM MILE')]},
      {y: 60, words: [H('GUL KHILE', {hot: true, anchor: true})]},
    ],
  },
  {
    id: 'l11',
    text: 'Gul Khile Jo Tum Mile',
    meaning: 'The flowers bloom whenever you meet me',
    why: 'Match-cut: "GUL KHILE" stays locked in place from the last line while the other words shatter away and orbit back in.',
    startBeat: 72,
    enter: 'match',
    palette: 'bloom',
    theme: 'petals',
    fx: ['aura'],
    hotFx: 'bloom',
    rows: [
      {y: -128, words: [I('jo tum mile')]},
      {y: 60, words: [H('GUL KHILE', {hot: true, anchor: true})]},
    ],
  },
  {
    id: 'l12',
    text: 'Gulzaar Zindagi Ye Ho Gayi',
    meaning: 'My life has become a garden',
    why: 'The release: everything at once. Aura, bokeh, rays, flare, sparkle, a confetti-petal explosion and liquid wave type.',
    startBeat: 76,
    enter: 'zPush',
    palette: 'finale',
    theme: 'petals',
    fx: ['aura', 'bokeh', 'rays', 'flare', 'sparkle', 'bigShock'],
    hotFx: 'wave',
    baseFx: 'bloom',
    burst: 'confetti',
    rows: [
      {words: [H('GULZAAR', {hot: true})]},
      {words: [H('ZINDAGI')]},
      {words: [I('ye ho gayi')]},
    ],
  },
];
