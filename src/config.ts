import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------
export const FPS = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// ---------------------------------------------------------------------------
// Audio: public/song.mp3, the 0:25 - 1:08 window
// ---------------------------------------------------------------------------
export const AUDIO_FILE = 'song.mp3';

// Measured from the supplied track by fitting the kick drum over 0:26 - 1:08:
// a kick lands every ~1.0166 s (118.05 BPM, one kick every 2 beats).
// FIRST_KICK_SEC is the on-grid kick closest to 0:25.
export const BPM = 118.05;
export const BEAT_SEC = 60 / BPM;
export const FIRST_KICK_SEC = 25.326;

// The video starts one beat before the first lyric (frame-aligned).
export const AUDIO_START_FRAME = 1487; // 24.78 s
export const AUDIO_START_SEC = AUDIO_START_FRAME / FPS;

// Convert a beat index (0 = first lyric) into a frame of the video.
export const beatToFrame = (beat: number) =>
  Math.round((FIRST_KICK_SEC + beat * BEAT_SEC - AUDIO_START_SEC) * FPS);

export const LYRICS_END_BEAT = 84; // ~1:08
export const OUTRO_FRAMES = 54;
export const DURATION_IN_FRAMES = beatToFrame(LYRICS_END_BEAT) + OUTRO_FRAMES;

// ---------------------------------------------------------------------------
// Frequency analysis (visualizeAudio)
// ---------------------------------------------------------------------------
// 1024 bins over 0 - 22.05 kHz = ~21.5 Hz per bin. Bands are defined in Hz and
// converted to bin ranges in audio.tsx, so they stay correct if this changes.
export const FFT_SAMPLES = 1024;
export const BAND_HZ = {
  bass: [30, 140], // kick / 808
  mid: [300, 3400], // vocals
  high: [5000, 12000], // hats / snare snap
} as const;

// ---------------------------------------------------------------------------
// Transitions: 10-frame overlaps, starting 4 frames before the beat
// ---------------------------------------------------------------------------
export const TR_FRAMES = 10;
export const TR_LEAD = 4;

// ---------------------------------------------------------------------------
// Fonts: heavy condensed sans + expressive italic serif
// ---------------------------------------------------------------------------
const anton = loadAnton('normal', {weights: ['400'], subsets: ['latin']});
const playfair = loadPlayfair('italic', {
  weights: ['700', '900'],
  subsets: ['latin'],
});

export const FONT_HEAVY = anton.fontFamily;
export const FONT_ITALIC = playfair.fontFamily;
