import React from 'react';
import {AbsoluteFill, interpolate, random} from 'remotion';
import {HEIGHT, WIDTH} from './config';
import type {FrameAudio} from './audio';
import type {PaletteDef} from './lyrics';
import {CENTER_Y} from './Words';
import {clamp, easeOutCubic, heartPath, lerp, mod, rgba} from './utils';

export type EffectProps = {
  frame: number;
  tIn: number;
  a: FrameAudio;
  pal: PaletteDef;
  seed: string;
};

const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT};

// ---------------------------------------------------------------------------
// Euphoric / melodic
// ---------------------------------------------------------------------------

/** Neon aura behind the words; swells with the vocal. */
export const Aura: React.FC<EffectProps> = ({a, pal}) => (
  <div
    style={{
      ...full,
      mixBlendMode: 'screen',
      background: `radial-gradient(ellipse 72% 38% at 50% 47%, ${rgba(pal.accent, 0.3 + 0.35 * a.vocal)} 0%, ${rgba(pal.c1, 0.22 + 0.22 * a.mid)} 38%, transparent 72%)`,
    }}
  />
);

/** Floating bokeh orbs, breathing with the bass. */
export const Bokeh: React.FC<EffectProps> = ({frame, a, pal, seed}) => {
  const cols = [pal.c1, pal.c2, pal.c3, pal.accent];
  return (
    <div style={{...full, mixBlendMode: 'screen'}}>
      {Array.from({length: 16}, (_, i) => {
        const r1 = random(`${seed}bk${i}a`);
        const r2 = random(`${seed}bk${i}b`);
        const r3 = random(`${seed}bk${i}c`);
        const size = 140 + r2 * 260;
        const span = HEIGHT + size * 2;
        const top = HEIGHT + size - mod(r1 * span + frame * (0.8 + r3 * 1.8), span);
        const left = r3 * WIDTH + Math.sin(frame * 0.02 + r1 * 9) * 50 - size / 2;
        const col = cols[i % cols.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${rgba(col, 0.55)} 0%, ${rgba(col, 0.18)} 55%, transparent 70%)`,
              transform: `scale(${1 + 0.18 * a.bass})`,
              opacity: 0.35 + 0.4 * a.mid,
            }}
          />
        );
      })}
    </div>
  );
};

const STAR = '0,-1 0.2,-0.2 1,0 0.2,0.2 0,1 -0.2,0.2 -1,0 -0.2,-0.2';

/** Four-point sparkles that twinkle on the hats. */
export const Sparkle: React.FC<EffectProps> = ({frame, a, pal, seed}) => (
  <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    {Array.from({length: 24}, (_, i) => {
      const x = random(`${seed}sp${i}x`) * WIDTH;
      const y = HEIGHT * 0.12 + random(`${seed}sp${i}y`) * HEIGHT * 0.72;
      const ph = random(`${seed}sp${i}p`) * Math.PI * 2;
      const tw = Math.pow(Math.max(0, Math.sin(frame * 0.11 + ph)), 2);
      const r = (14 + random(`${seed}sp${i}r`) * 40) * tw * (0.6 + 0.9 * a.high + 0.6 * a.hat);
      if (r < 1) return null;
      return (
        <polygon
          key={i}
          points={STAR}
          transform={`translate(${x} ${y}) scale(${r})`}
          fill={i % 2 ? pal.accent : '#ffffff'}
          opacity={0.9}
        />
      );
    })}
  </svg>
);

// ---------------------------------------------------------------------------
// Movement / speed / flying
// ---------------------------------------------------------------------------

/** Speed lines: vertical (rising) or horizontal (rushing past). */
export const SpeedLines: React.FC<EffectProps & {dir: 'up' | 'left'}> = ({frame, a, pal, seed, dir}) => (
  <div style={{...full, overflow: 'hidden'}}>
    {Array.from({length: 34}, (_, i) => {
      const r1 = random(`${seed}sl${i}a`);
      const r2 = random(`${seed}sl${i}b`);
      const r3 = random(`${seed}sl${i}c`);
      const len = 360 + r2 * 820;
      const thick = 3 + r1 * 8;
      const speed = 34 + r3 * 52 + 70 * a.energy;
      const span = (dir === 'up' ? HEIGHT : WIDTH) + len * 2;
      const pos = mod(r2 * span + frame * speed, span);
      const op = 0.25 + 0.6 * r1 * (0.5 + a.energy);
      const col = rgba(pal.accent, 0.85);
      const style: React.CSSProperties =
        dir === 'up'
          ? {
              left: r1 * WIDTH,
              top: HEIGHT - pos,
              width: thick,
              height: len,
              background: `linear-gradient(to top, transparent, ${col}, transparent)`,
            }
          : {
              top: r1 * HEIGHT,
              left: WIDTH - pos,
              width: len,
              height: thick,
              background: `linear-gradient(to left, transparent, ${col}, transparent)`,
            };
      return <div key={i} style={{position: 'absolute', borderRadius: 999, opacity: op, ...style}} />;
    })}
  </div>
);

/** Lens flare with an anamorphic streak that sweeps across the frame. */
export const LensFlare: React.FC<EffectProps> = ({frame, tIn, a, pal}) => {
  const t = frame - tIn;
  const cx = interpolate(t, [-10, 140], [WIDTH * 0.1, WIDTH * 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cy = HEIGHT * 0.36 + Math.sin(t * 0.05) * 60;
  const k = 0.55 + 0.45 * a.hat + 0.25 * a.bass;
  return (
    <div style={{...full, mixBlendMode: 'screen'}}>
      <div
        style={{
          position: 'absolute',
          left: cx - 420,
          top: cy - 420,
          width: 840,
          height: 840,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${rgba('#ffffff', 0.85 * k)} 0%, ${rgba(pal.accent, 0.5 * k)} 12%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: cx - 900,
          top: cy - 5,
          width: 1800,
          height: 10,
          filter: 'blur(2px)',
          background: `linear-gradient(90deg, transparent, ${rgba(pal.accent, 0.9 * k)}, #ffffff, ${rgba(pal.accent, 0.9 * k)}, transparent)`,
        }}
      />
      {[0.35, 0.6, 0.85].map((g, i) => {
        const gx = lerp(cx, WIDTH / 2, g);
        const gy = lerp(cy, HEIGHT / 2, g);
        const s = 60 + i * 50;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: gx - s / 2,
              top: gy - s / 2,
              width: s,
              height: s,
              borderRadius: '50%',
              border: `3px solid ${rgba(i % 2 ? pal.c1 : pal.c2, 0.5 * k)}`,
            }}
          />
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Divine / impact / heart / gaze
// ---------------------------------------------------------------------------

/** God-rays fanning out from behind the words. */
export const Rays: React.FC<EffectProps> = ({frame, a, pal}) => {
  const mask = 'radial-gradient(circle at 50% 46%, #000 0%, transparent 72%)';
  return (
    <div
      style={{
        ...full,
        mixBlendMode: 'screen',
        opacity: 0.35 + 0.55 * a.bass,
        background: `repeating-conic-gradient(from ${frame * 0.5}deg at 50% 46%, ${rgba(pal.accent, 0.34)} 0deg 5deg, transparent 5deg 22deg)`,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    />
  );
};

const HEART_D = heartPath(26);

/** A giant heart that pulses on every kick. */
export const Heart: React.FC<EffectProps> = ({a, pal}) => (
  <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    <g transform={`translate(${WIDTH / 2} ${CENTER_Y})`}>
      {[0, 1, 2].map((k) => {
        const s = 1 + k * 0.28 + 0.16 * a.kick * (1 - k * 0.25);
        return (
          <path
            key={k}
            d={HEART_D}
            transform={`scale(${s})`}
            fill={k === 0 ? rgba(pal.c1, 0.26 + 0.3 * a.kick) : 'none'}
            stroke={rgba(pal.accent, 0.85 - k * 0.27)}
            strokeWidth={6 - k * 1.6}
          />
        );
      })}
    </g>
  </svg>
);

/** Concentric rings contracting into an iris: a gaze pulling focus. */
export const FocusRings: React.FC<EffectProps> = ({frame, a, pal}) => (
  <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    {Array.from({length: 8}, (_, k) => {
      const R = 1000 - mod(frame * 9 + k * 125, 1000);
      const o = clamp(R / 1000) * 0.6 * (0.4 + a.bass);
      return (
        <circle
          key={k}
          cx={WIDTH / 2}
          cy={CENTER_Y}
          r={R}
          fill="none"
          stroke={rgba(pal.accent, o)}
          strokeWidth={3 + 6 * (1 - R / 1000)}
        />
      );
    })}
    <circle cx={WIDTH / 2} cy={CENTER_Y} r={70 + 40 * a.kick} fill={rgba(pal.accent, 0.18)} />
    <circle cx={WIDTH / 2} cy={CENTER_Y} r={26 + 16 * a.kick} fill="rgba(0, 0, 0, 0.55)" />
  </svg>
);

/** RGB tear bars: shows on hats, and in a burst when the line lands. */
export const RgbTear: React.FC<EffectProps> = ({frame, tIn, a, seed}) => {
  const landing = frame - tIn >= 0 && frame - tIn < 14;
  if (!(a.hat > 0.3 || landing)) return null;
  const sf = Math.floor(frame / 2);
  return (
    <div style={{...full, mixBlendMode: 'screen'}}>
      {Array.from({length: 7}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            width: WIDTH,
            top: random(`${seed}t${sf}${i}y`) * HEIGHT,
            height: 6 + random(`${seed}t${sf}${i}h`) * 40,
            background: i % 2 ? 'rgba(255, 42, 90, 0.5)' : 'rgba(25, 227, 255, 0.5)',
            transform: `translateX(${(random(`${seed}t${sf}${i}x`) - 0.5) * 140}px)`,
          }}
        />
      ))}
    </div>
  );
};

/** Scanlines with a slow rolling bar. */
export const Scanlines: React.FC<EffectProps> = ({frame}) => (
  <div style={full}>
    <div
      style={{
        ...full,
        opacity: 0.55,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 5px)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: WIDTH,
        height: 220,
        top: mod(frame * 9, HEIGHT + 440) - 220,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent)',
      }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Glitch: slice displacement on hat / snare hits
// ---------------------------------------------------------------------------
export const GlitchSlices: React.FC<{frame: number; a: FrameAudio; children: React.ReactNode}> = ({
  frame,
  a,
  children,
}) => {
  const active = a.hat > 0.5;
  return (
    <>
      {children}
      {active &&
        [0, 1, 2].map((k) => {
          const top = random(`gs${frame}${k}t`) * 88;
          const h = 4 + random(`gs${frame}${k}h`) * 14;
          const dx = (random(`gs${frame}${k}x`) - 0.5) * 2 * (40 + 70 * a.hat);
          return (
            <div
              key={k}
              style={{
                ...full,
                clipPath: `inset(${top}% 0 ${100 - top - h}% 0)`,
                transform: `translateX(${dx}px)`,
              }}
            >
              {children}
            </div>
          );
        })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Global overlays (outside the camera)
// ---------------------------------------------------------------------------

/** Radial shockwave rings on every kick, plus heavier ones when a line slams. */
export const Shockwaves: React.FC<{
  frame: number;
  kickHits: number[];
  bigHits: number[];
  pal: PaletteDef;
}> = ({frame, kickHits, bigHits, pal}) => {
  const rings: Array<{age: number; life: number; w: number; o: number; R: number}> = [];
  for (const h of kickHits) {
    const age = frame - h;
    if (age >= 0 && age < 26) rings.push({age, life: 26, w: 22, o: 0.7, R: 1300});
  }
  for (const h of bigHits) {
    for (const delay of [0, 5]) {
      const age = frame - h - delay;
      if (age >= 0 && age < 40) rings.push({age, life: 40, w: 44, o: 0.9, R: 1700});
    }
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
      {rings.map((r, i) => {
        const t = r.age / r.life;
        return (
          <circle
            key={i}
            cx={WIDTH / 2}
            cy={CENTER_Y}
            r={easeOutCubic(t) * r.R}
            fill="none"
            stroke={rgba(i % 2 ? pal.c1 : pal.accent, (1 - t) * r.o)}
            strokeWidth={(1 - t) * r.w + 2}
          />
        );
      })}
    </svg>
  );
};

/** White strobe on strong hat/snare hits (rate-limited in audio.tsx). */
export const Strobe: React.FC<{a: FrameAudio}> = ({a}) =>
  a.strobe > 0.05 ? (
    <div style={{...full, background: '#ffffff', opacity: 0.16 * a.strobe, mixBlendMode: 'screen'}} />
  ) : null;

/** Inverted-colour flash on slam lines (applies to the whole frame). */
export const InvertFlash: React.FC<{frame: number; at: number[]}> = ({frame, at}) => {
  let o = 0;
  for (const t0 of at) {
    o = Math.max(
      o,
      interpolate(frame - t0, [0, 1, 3, 6], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
  }
  return o > 0.01 ? <AbsoluteFill style={{background: '#ffffff', mixBlendMode: 'difference', opacity: o}} /> : null;
};

export const Vignette: React.FC<{a: FrameAudio}> = ({a}) => (
  <div
    style={{
      ...full,
      background: `radial-gradient(ellipse 85% 70% at 50% 48%, transparent 45%, rgba(0,0,0,${0.5 + 0.2 * (1 - a.energy)}) 100%)`,
    }}
  />
);
