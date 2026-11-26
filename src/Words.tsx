import React from 'react';
import {random, spring} from 'remotion';
import {FONT_HEAVY, FONT_ITALIC, HEIGHT, TR_LEAD, WIDTH} from './config';
import type {FrameAudio} from './audio';
import type {LyricLine, PaletteDef, Row, TransitionKind, WordCfg, WordFx} from './lyrics';
import {clamp} from './utils';

const MAX_W = 920; // keeps 80px safe margins on a 1080px canvas
const ITALIC_SCALE = 0.72;
export const CENTER_Y = HEIGHT * 0.47;

// ---------------------------------------------------------------------------
// Layout: fit each row inside the safe width, stack rows around the centre.
// ---------------------------------------------------------------------------
export const rowMetrics = (row: Row) => {
  const hasHeavy = row.words.some((w) => w.face === 'heavy');
  const em = row.words.reduce((sum, w, i) => {
    const perChar = w.face === 'heavy' ? 0.5 : 0.56 * (hasHeavy ? ITALIC_SCALE : 1);
    return sum + w.t.length * perChar + (i > 0 ? 0.3 : 0);
  }, 0);
  const maxFs = hasHeavy ? 260 : 170;
  return {fs: Math.min(maxFs, MAX_W / em), hasHeavy};
};

export const layoutRows = (rows: Row[]) => {
  const metrics = rows.map(rowMetrics);
  const heights = metrics.map((m) => m.fs * 0.92);
  const gap = 26;
  const total = heights.reduce((s, h) => s + h, 0) + gap * (rows.length - 1);
  let cursor = -total / 2;
  return rows.map((r, i) => {
    const y = r.y ?? cursor + heights[i] / 2;
    cursor += heights[i] + gap;
    return {y, fs: metrics[i].fs, hasHeavy: metrics[i].hasHeavy};
  });
};

// ---------------------------------------------------------------------------
// Per-scene context handed down from LyricScene
// ---------------------------------------------------------------------------
export type SceneCtx = {
  frame: number;
  fps: number;
  tIn: number;
  p: number;
  q: number;
  enter: TransitionKind;
  exit: TransitionKind;
  a: FrameAudio;
  pal: PaletteDef;
  line: LyricLine;
};

type Motion = {x: number; y: number; rot: number; scale: number; opacity: number};

// Match-cut: anchors stay put, everything else shatters away / orbits back in.
const matchMotion = (
  key: string,
  anchor: boolean,
  p: number,
  q: number,
  matchIn: boolean,
  matchOut: boolean,
): Motion => {
  const m: Motion = {x: 0, y: 0, rot: 0, scale: 1, opacity: 1};
  if (anchor) return m;
  if (matchIn) {
    const ang = random(`${key}-a`) * Math.PI * 2;
    const dir = random(`${key}-d`) > 0.5 ? 1 : -1;
    const left = 1 - p;
    const spin = left * 2.4 * dir;
    const R = 760 * left;
    m.x += Math.cos(ang + spin) * R;
    m.y += Math.sin(ang + spin) * R;
    m.rot += spin * 40;
    m.scale *= 0.5 + 0.5 * clamp(p);
    m.opacity *= clamp(p * 3);
  }
  if (matchOut) {
    const ang = random(`${key}-o`) * Math.PI * 2;
    m.x += Math.cos(ang) * q * 950;
    m.y += Math.sin(ang) * q * 950 + q * q * 420;
    m.rot += (random(`${key}-r`) - 0.5) * q * 720;
    m.scale *= 1 - 0.7 * q;
    m.opacity *= 1 - q;
  }
  return m;
};

type LetterMotion = {dx: number; dy: number; sx: number; sy: number; rot: number};

const letterMotion = (
  fx: WordFx,
  i: number,
  n: number,
  frame: number,
  a: FrameAudio,
  key: string,
  weight: number,
): LetterMotion => {
  const none: LetterMotion = {dx: 0, dy: 0, sx: 1, sy: 1, rot: 0};
  switch (fx) {
    case 'wave': {
      // Liquid wave: a travelling sine whose height follows the vocal.
      const amp = (8 + 34 * a.vocal + 10 * a.mid) * weight;
      const ph = frame * 0.16 + i * 0.7;
      return {dx: 0, dy: Math.sin(ph) * amp, sx: 1, sy: 1 + 0.06 * Math.sin(ph) * weight, rot: Math.sin(frame * 0.12 + i) * 2 * weight};
    }
    case 'stretch': {
      const k = (0.16 + 0.45 * a.kick + 0.25 * a.vocal) * weight;
      return {dx: 0, dy: -Math.abs(Math.sin(i * 1.7)) * 22 * a.hat * weight, sx: 1 - 0.06 * k, sy: 1 + k, rot: 0};
    }
    case 'glitch': {
      const on = a.hat > 0.45 ? 1 : 0;
      const rx = random(`${key}x${frame}${i}`) - 0.5;
      return {
        dx: rx * 46 * on + (random(`${key}y${frame}`) - 0.5) * 8 * a.vocal,
        dy: (random(`${key}z${frame}${i}`) - 0.5) * 14 * on,
        sx: 1 + 0.12 * on * rx,
        sy: 1,
        rot: rx * 6 * on,
      };
    }
    case 'bloom': {
      const s = 1 + 0.16 * a.kick * weight;
      return {dx: (i - (n - 1) / 2) * a.kick * 10 * weight, dy: -a.kick * 10 * weight, sx: s, sy: s, rot: 0};
    }
    case 'pulse': {
      const s = 1 + 0.22 * a.kick * weight;
      return {dx: 0, dy: 0, sx: s, sy: s, rot: 0};
    }
    case 'slam':
    case 'none':
    default:
      return none;
  }
};

// ---------------------------------------------------------------------------
// One word (heavy condensed or italic accent), animated letter by letter
// ---------------------------------------------------------------------------
const WordView: React.FC<{
  word: WordCfg;
  rowFs: number;
  hasHeavy: boolean;
  ri: number;
  wi: number;
  ctx: SceneCtx;
}> = ({word, rowFs, hasHeavy, ri, wi, ctx}) => {
  const {a, pal, line, frame, fps, tIn} = ctx;
  const key = `${line.id}-${ri}-${wi}`;
  const heavy = word.face === 'heavy';
  const hot = !!word.hot;
  const fs = heavy ? rowFs : rowFs * (hasHeavy ? ITALIC_SCALE : 1);
  const fx: WordFx = hot ? line.hotFx : (line.baseFx ?? 'none');
  const weight = hot ? 1 : 0.55;

  const matchIn = ctx.enter === 'match';
  const matchOut = ctx.exit === 'match';
  const anchor = !!word.anchor;
  const mm =
    matchIn || matchOut
      ? matchMotion(key, anchor, ctx.p, ctx.q, matchIn, matchOut)
      : {x: 0, y: 0, rot: 0, scale: 1, opacity: 1};

  // Entrance: staggered spring pop. Slam words come in huge and heavy.
  const slam = hot && line.hotFx === 'slam';
  const s = spring({
    frame: Math.max(0, frame - (tIn - TR_LEAD + ri * 2 + wi * 3)),
    fps,
    config: slam ? {damping: 9, stiffness: 260} : {damping: 12, stiffness: 200},
  });
  const useEntrance = !matchIn;
  const ent = !useEntrance
    ? {scale: 1, y: 0, op: 1}
    : slam
      ? {scale: 3.4 - 2.4 * s, y: 0, op: clamp(s * 6)}
      : {scale: 0.7 + 0.3 * s, y: (1 - s) * 70, op: clamp(s * 4)};

  // Mid-range drives RGB split, glow and letter expansion.
  const d = hot ? 3 + 15 * a.vocal : 1 + 5 * a.vocal;
  const glow = hot ? 16 + 70 * a.mid + 40 * a.vocal : 6 + 22 * a.mid;
  const color = heavy ? (hot ? pal.accent : '#ffffff') : pal.accent;
  const spacing = (heavy ? 0.02 : 0) + (hot ? 0.09 : 0.03) * a.vocal;

  const textShadow = [
    `${-d}px 0 0 rgba(255, 40, 90, 0.9)`,
    `${d}px 0 0 rgba(30, 220, 255, 0.9)`,
    `0 0 ${glow}px ${pal.accent}`,
    `0 0 ${glow * 2.4}px ${pal.c1}`,
    '0 10px 30px rgba(0, 0, 0, 0.65)',
  ].join(', ');

  const chars = word.t.split('');

  return (
    <span
      style={{
        display: 'inline-flex',
        fontFamily: heavy ? FONT_HEAVY : FONT_ITALIC,
        fontWeight: heavy ? 400 : 900,
        fontStyle: heavy ? 'normal' : 'italic',
        fontSize: fs,
        lineHeight: 1,
        letterSpacing: `${spacing}em`,
        whiteSpace: 'pre',
        color,
        textShadow,
        opacity: mm.opacity * ent.op,
        transform: `translate(${mm.x}px, ${mm.y + ent.y}px) rotate(${mm.rot}deg) scale(${mm.scale * ent.scale})`,
      }}
    >
      {chars.map((ch, i) => {
        const m = letterMotion(fx, i, chars.length, frame, a, key, weight);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translate(${m.dx}px, ${m.dy}px) scale(${m.sx}, ${m.sy}) rotate(${m.rot}deg)`,
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
    </span>
  );
};

export const Rows: React.FC<{ctx: SceneCtx}> = ({ctx}) => {
  const rows = ctx.line.rows;
  const lay = layoutRows(rows);
  return (
    <>
      {rows.map((row, ri) => {
        const L = lay[ri];
        return (
          <div
            key={ri}
            style={{
              position: 'absolute',
              left: 0,
              width: WIDTH,
              top: CENTER_Y + L.y - L.fs / 2,
              height: L.fs,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: L.fs * 0.3,
            }}
          >
            {row.words.map((w, wi) => (
              <WordView
                key={wi}
                word={w}
                rowFs={L.fs}
                hasHeavy={L.hasHeavy}
                ri={ri}
                wi={wi}
                ctx={ctx}
              />
            ))}
          </div>
        );
      })}
    </>
  );
};
