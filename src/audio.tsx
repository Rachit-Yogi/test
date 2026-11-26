import React, {createContext, useContext, useMemo} from 'react';
import {staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import type {AudioData} from '@remotion/media-utils';
import {
  AUDIO_FILE,
  AUDIO_START_FRAME,
  BAND_HZ,
  DURATION_IN_FRAMES,
  FFT_SAMPLES,
} from './config';
import {clamp} from './utils';

// ---------------------------------------------------------------------------
// Live spectrum -> per-frame reactive values.
//
// visualizeAudio() is run for every frame of the video (once, memoised), then
// each band is normalised against the track itself, so nothing depends on the
// absolute loudness of the master. Hits (kick / hat / vocal / strobe) are found
// by comparing each frame with its recent past, then turned into decaying
// envelopes.
// ---------------------------------------------------------------------------

export type FrameAudio = {
  /** Smoothed sub-bass energy, 0..1 */
  bass: number;
  /** Kick envelope: 1 on the hit, decays over ~10 frames */
  kick: number;
  /** Vocal-band energy, 0..1 */
  mid: number;
  /** Vocal-peak envelope */
  vocal: number;
  /** Hi-hat band energy, 0..1 */
  high: number;
  /** Hat / snare envelope: 1 on the hit, decays over ~4 frames */
  hat: number;
  /** Rate-limited white flash envelope (max ~2.5 per second) */
  strobe: number;
  /** Overall energy */
  energy: number;
};

export type AudioTimeline = {
  frames: FrameAudio[];
  kickHits: number[];
  hatHits: number[];
  strobeHits: number[];
};

const ZERO: FrameAudio = {
  bass: 0,
  kick: 0,
  mid: 0,
  vocal: 0,
  high: 0,
  hat: 0,
  strobe: 0,
  energy: 0,
};

const percentile = (arr: number[], p: number) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
};

const normalise = (arr: number[]) => {
  const lo = percentile(arr, 0.05);
  const hi = Math.max(lo + 1e-6, percentile(arr, 0.98));
  return arr.map((v) => clamp((v - lo) / (hi - lo)));
};

const smoothRelease = (x: number[], release: number) => {
  const out: number[] = [];
  let prev = 0;
  for (const v of x) {
    prev = Math.max(v, prev * release);
    out.push(prev);
  }
  return out;
};

const detectHits = (
  x: number[],
  opts: {window: number; threshold: number; refractory: number; floor?: number},
) => {
  const hits: number[] = [];
  let last = -1e9;
  for (let i = 1; i < x.length - 1; i++) {
    const start = Math.max(0, i - opts.window);
    let mean = 0;
    for (let j = start; j < i; j++) mean += x[j];
    mean /= Math.max(1, i - start);
    const isPeak = x[i] >= x[i - 1] && x[i] >= x[i + 1];
    if (
      isPeak &&
      x[i] - mean > opts.threshold &&
      x[i] >= (opts.floor ?? 0) &&
      i - last >= opts.refractory
    ) {
      hits.push(i);
      last = i;
    }
  }
  return hits;
};

const hitEnvelope = (n: number, hits: number[], decay: number) => {
  const out = new Array<number>(n).fill(0);
  let cur = 0;
  let hi = 0;
  for (let f = 0; f < n; f++) {
    cur *= decay;
    while (hi < hits.length && hits[hi] <= f) {
      cur = 1;
      hi++;
    }
    out[f] = cur;
  }
  return out;
};

const buildTimeline = (audioData: AudioData, fps: number): AudioTimeline => {
  const n = DURATION_IN_FRAMES;
  const nyquist = audioData.sampleRate / 2;
  const hzToBin = (hz: number) =>
    Math.max(0, Math.min(FFT_SAMPLES - 1, Math.round((hz / nyquist) * FFT_SAMPLES)));
  const range = (r: readonly [number, number]): [number, number] => {
    const lo = hzToBin(r[0]);
    return [lo, Math.max(lo + 1, hzToBin(r[1]))];
  };
  const [bLo, bHi] = range(BAND_HZ.bass);
  const [mLo, mHi] = range(BAND_HZ.mid);
  const [hLo, hHi] = range(BAND_HZ.high);

  const avg = (arr: number[], lo: number, hi: number) => {
    let s = 0;
    for (let i = lo; i < hi; i++) s += arr[i] ?? 0;
    return s / Math.max(1, hi - lo);
  };

  const rawBass: number[] = [];
  const rawMid: number[] = [];
  const rawHigh: number[] = [];
  for (let f = 0; f < n; f++) {
    const spectrum = visualizeAudio({
      fps,
      frame: f + AUDIO_START_FRAME,
      audioData,
      numberOfSamples: FFT_SAMPLES,
      optimizeFor: 'speed',
    });
    rawBass.push(avg(spectrum, bLo, bHi));
    rawMid.push(avg(spectrum, mLo, mHi));
    rawHigh.push(avg(spectrum, hLo, hHi));
  }

  const bassN = normalise(rawBass);
  const midN = normalise(rawMid);
  const highN = normalise(rawHigh);

  const kickHits = detectHits(bassN, {window: 20, threshold: 0.2, refractory: 18, floor: 0.35});
  const hatHits = detectHits(highN, {window: 8, threshold: 0.18, refractory: 6, floor: 0.3});
  const vocalHits = detectHits(midN, {window: 14, threshold: 0.16, refractory: 10, floor: 0.3});

  // Strobe: only the strongest hat/snare hits, never more than 2 per second
  // (keeps flashing well under the 3-per-second photosensitivity guideline).
  const strobeHits: number[] = [];
  let lastStrobe = -1e9;
  for (const h of hatHits) {
    if (highN[h] > 0.95 && h - lastStrobe >= 30) {
      strobeHits.push(h);
      lastStrobe = h;
    }
  }

  const kickEnv = hitEnvelope(n, kickHits, 0.88);
  const hatEnv = hitEnvelope(n, hatHits, 0.74);
  const vocalEnv = hitEnvelope(n, vocalHits, 0.9);
  const strobeEnv = hitEnvelope(n, strobeHits, 0.55);
  const bassSmooth = smoothRelease(bassN, 0.86);

  const frames: FrameAudio[] = [];
  for (let f = 0; f < n; f++) {
    frames.push({
      bass: bassSmooth[f],
      kick: kickEnv[f],
      mid: midN[f],
      vocal: Math.max(vocalEnv[f] * 0.9, midN[f] * 0.6),
      high: highN[f],
      hat: hatEnv[f],
      strobe: strobeEnv[f],
      energy: (bassN[f] + midN[f] + highN[f]) / 3,
    });
  }

  return {frames, kickHits, hatHits, strobeHits};
};

// ---------------------------------------------------------------------------
// Context: read the audio once at the root, hand the global frame to everyone.
// (Children inside <Sequence> would otherwise see a shifted local frame.)
// ---------------------------------------------------------------------------

type Ctx = {timeline: AudioTimeline | null; frame: number};

const AudioCtx = createContext<Ctx>({timeline: null, frame: 0});

export const AudioReactive: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(staticFile(AUDIO_FILE));
  const timeline = useMemo(
    () => (audioData ? buildTimeline(audioData, fps) : null),
    [audioData, fps],
  );
  const value = useMemo(() => ({timeline, frame}), [timeline, frame]);
  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
};

export const useAudio = () => {
  const {timeline, frame} = useContext(AudioCtx);
  const idx = Math.max(0, Math.min(DURATION_IN_FRAMES - 1, frame));
  const a: FrameAudio = timeline ? timeline.frames[idx] : ZERO;
  return {a, timeline, frame};
};
