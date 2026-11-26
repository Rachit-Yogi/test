import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, random, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {AudioReactive, useAudio} from './audio';
import {Background, Grain} from './Background';
import {InvertFlash, Shockwaves, Strobe, Vignette} from './Effects';
import {LyricScene} from './LyricScene';
import {LYRICS, PALETTES} from './lyrics';
import type {Burst} from './lyrics';
import {
  AUDIO_FILE,
  AUDIO_START_FRAME,
  LYRICS_END_BEAT,
  TR_FRAMES,
  TR_LEAD,
  beatToFrame,
} from './config';
import {clamp} from './utils';

/**
 * Frame at which each line lands, snapped to the nearest detected kick
 * (within 4 frames) or, failing that, hi-hat / snare hit (within 3 frames), so
 * flips and whips are locked to what you actually hear. The last entry is the
 * end of the lyrics (when the last line leaves).
 */
const computeTimes = (kickHits: number[], hatHits: number[]) => {
  const nearest = (hits: number[], target: number, maxDist: number) => {
    let best: number | null = null;
    let bestDist = maxDist + 1;
    for (const h of hits) {
      const d = Math.abs(h - target);
      if (d < bestDist) {
        bestDist = d;
        best = h;
      }
    }
    return best;
  };
  const times = LYRICS.map((l) => {
    const nominal = beatToFrame(l.startBeat);
    return nearest(kickHits, nominal, 4) ?? nearest(hatHits, nominal, 3) ?? nominal;
  });
  times.push(beatToFrame(LYRICS_END_BEAT));
  return times;
};

const activeIndex = (times: number[], frame: number) => {
  let idx = 0;
  for (let i = 0; i < LYRICS.length; i++) {
    if (frame >= times[i] - TR_LEAD) idx = i;
  }
  return idx;
};

const Stage: React.FC = () => {
  const {a, timeline, frame} = useAudio();

  const kickHits = useMemo(() => timeline?.kickHits ?? [], [timeline]);
  const hatHits = useMemo(() => timeline?.hatHits ?? [], [timeline]);
  const times = useMemo(() => computeTimes(kickHits, hatHits), [kickHits, hatHits]);

  const bursts = useMemo(
    () =>
      LYRICS.flatMap((l, i) => (l.burst ? [{frame: times[i], kind: l.burst as Burst}] : [])),
    [times],
  );
  const bigHits = useMemo(
    () => LYRICS.flatMap((l, i) => (l.fx.includes('bigShock') ? [times[i]] : [])),
    [times],
  );
  const invertAt = useMemo(
    () => LYRICS.flatMap((l, i) => (l.fx.includes('invertFlash') ? [times[i]] : [])),
    [times],
  );

  const idx = activeIndex(times, frame);
  const prevIdx = Math.max(0, idx - 1);
  const line = LYRICS[idx];
  const pal = PALETTES[line.palette];
  const prevPal = PALETTES[LYRICS[prevIdx].palette];
  const pp = idx === 0 ? 1 : clamp((frame - (times[idx] - TR_LEAD)) / (TR_FRAMES + 6));

  // Camera: bass punch (1.0 -> 1.12), micro shake on every kick, a heavier
  // shake when a slam line lands, and a slow push-in across each line.
  const sinceIn = frame - times[idx];
  const span = Math.max(1, times[idx + 1] - times[idx]);
  const slam = line.hotFx === 'slam' ? Math.max(0, 1 - sinceIn / 12) : 0;
  const shake = 4 + 18 * a.kick + 40 * slam;
  const rotShake = 0.5 * a.kick + 1.8 * slam;
  const bassScale = 1 + 0.12 * (0.75 * a.kick + 0.25 * a.bass);
  const drift = 1 + 0.04 * clamp(sinceIn / span);
  const camera = `translate(${(random(`cx${frame}`) - 0.5) * 2 * shake}px, ${(random(`cy${frame}`) - 0.5) * 2 * shake}px) rotate(${(random(`cr${frame}`) - 0.5) * 2 * rotShake}deg) scale(${bassScale * drift})`;

  return (
    <AbsoluteFill style={{backgroundColor: '#05010b', overflow: 'hidden'}}>
      <Audio src={staticFile(AUDIO_FILE)} trimBefore={AUDIO_START_FRAME} />

      <Background
        frame={frame}
        a={a}
        pal={pal}
        prevPal={prevPal}
        pp={pp}
        theme={line.theme}
        prevTheme={LYRICS[prevIdx].theme}
        bursts={bursts}
        hatHits={hatHits}
      />

      <AbsoluteFill style={{transform: camera}}>
        <Shockwaves frame={frame} kickHits={kickHits} bigHits={bigHits} pal={pal} />
        {LYRICS.map((l, i) => {
          const from = times[i] - TR_LEAD - 1;
          const duration = times[i + 1] - times[i] + TR_LEAD + 1 + TR_FRAMES + 3;
          return (
            <Sequence key={l.id} name={`${i + 1}. ${l.text}`} from={from} durationInFrames={duration}>
              <LyricScene index={i} times={times} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <InvertFlash frame={frame} at={invertAt} />
      <Strobe a={a} />
      <Vignette a={a} />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};

export const LyricVideo: React.FC = () => {
  return (
    <AudioReactive>
      <Stage />
    </AudioReactive>
  );
};
