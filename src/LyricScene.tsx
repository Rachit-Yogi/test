import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {TR_LEAD} from './config';
import {useAudio} from './audio';
import {LYRICS, PALETTES} from './lyrics';
import type {SceneFx, TransitionKind} from './lyrics';
import {enterXform, exitXform, trProgress} from './transitions';
import {Rows} from './Words';
import type {SceneCtx} from './Words';
import {
  Aura,
  Bokeh,
  FocusRings,
  GlitchSlices,
  Heart,
  LensFlare,
  Rays,
  RgbTear,
  Scanlines,
  Sparkle,
  SpeedLines,
} from './Effects';
import type {EffectProps} from './Effects';

/**
 * One lyric phrase. `times[i]` is the (beat-snapped) frame where line i lands;
 * `times[i + 1]` is where the next line lands, which is also when this one
 * starts leaving. Both transitions are 10-frame springs, so the outgoing and
 * incoming scenes always overlap and the picture is never static or empty.
 */
export const LyricScene: React.FC<{index: number; times: number[]}> = ({index, times}) => {
  const {a, frame} = useAudio();
  const {fps} = useVideoConfig();

  const line = LYRICS[index];
  const isLast = index === LYRICS.length - 1;
  const tIn = times[index];
  const tOut = times[index + 1];
  const enter = line.enter;
  const exit: TransitionKind = isLast ? 'zPush' : LYRICS[index + 1].enter;
  const pal = PALETTES[line.palette];

  const p = trProgress(frame, tIn - TR_LEAD, fps, false);
  const q = trProgress(frame, tOut - TR_LEAD, fps, true);
  const e = enterXform(enter, p);
  const x = exitXform(exit, q);

  const persp = e.persp || x.persp;
  const transform = [persp ? 'perspective(1600px)' : '', e.t, x.t].filter(Boolean).join(' ');
  const bx = Math.max(e.bx, x.bx);
  const by = Math.max(e.by, x.by);
  const bi = Math.max(e.bi, x.bi);
  const blurOn = bx + by + bi > 0.6;
  const fid = `mb-${index}`;

  const fxp: EffectProps = {frame, tIn, a, pal, seed: line.id};
  const has = (f: SceneFx) => line.fx.includes(f);
  const ctx: SceneCtx = {frame, fps, tIn, p, q, enter, exit, a, pal, line};

  return (
    <AbsoluteFill
      style={{
        transform: transform || undefined,
        opacity: e.o * x.o,
        filter: blurOn ? `url(#${fid})` : undefined,
        // While zooming through the old phrase it must stay on top of the new one.
        zIndex: exit === 'zPush' && q > 0 ? 3 : 2,
      }}
    >
      {blurOn && (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id={fid} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation={`${bx + bi} ${by + bi}`} />
            </filter>
          </defs>
        </svg>
      )}

      {/* Behind the words */}
      {has('aura') && <Aura {...fxp} />}
      {has('bokeh') && <Bokeh {...fxp} />}
      {has('rays') && <Rays {...fxp} />}
      {has('heart') && <Heart {...fxp} />}
      {has('focus') && <FocusRings {...fxp} />}
      {has('speedUp') && <SpeedLines {...fxp} dir="up" />}
      {has('speedLeft') && <SpeedLines {...fxp} dir="left" />}
      {has('sparkle') && <Sparkle {...fxp} />}

      <GlitchSlices frame={frame} a={a}>
        <Rows ctx={ctx} />
      </GlitchSlices>

      {/* In front of the words */}
      {has('flare') && <LensFlare {...fxp} />}
      {has('rgbTear') && <RgbTear {...fxp} />}
      {has('scanlines') && <Scanlines {...fxp} />}
    </AbsoluteFill>
  );
};
