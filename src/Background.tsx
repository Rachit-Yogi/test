import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, interpolateColors, random} from 'remotion';
import {HEIGHT, WIDTH} from './config';
import type {FrameAudio} from './audio';
import type {Burst, PaletteDef, Theme} from './lyrics';
import {CENTER_Y} from './Words';
import {HEART_POINTS, mod, rgba} from './utils';

// ---------------------------------------------------------------------------
// Static particle seeds (deterministic: no Math.random anywhere)
// ---------------------------------------------------------------------------
const PARTS = Array.from({length: 140}, (_, i) => ({
  x: random(`px${i}`),
  y: random(`py${i}`),
  s: random(`ps${i}`),
  p: random(`pp${i}`),
}));

type Ctx2D = CanvasRenderingContext2D;

const drawStar = (ctx: Ctx2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.18, y - r * 0.18);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.18, y + r * 0.18);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.18, y + r * 0.18);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.18, y - r * 0.18);
  ctx.closePath();
  ctx.fill();
};

const drawDust = (ctx: Ctx2D, frame: number, a: FrameAudio, pal: PaletteDef) => {
  for (let i = 0; i < 70; i++) {
    const P = PARTS[i];
    const x = P.x * WIDTH + Math.sin(frame * 0.01 + P.p * 6) * 40;
    const y = HEIGHT - mod(P.y * HEIGHT + frame * (0.6 + P.s * 1.6), HEIGHT);
    const r = 1.5 + P.s * 3.5 * (1 + a.bass);
    ctx.fillStyle = rgba(pal.accent, 0.25 + 0.5 * a.high * P.s);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawTheme = (
  ctx: Ctx2D,
  theme: Theme,
  frame: number,
  alpha: number,
  a: FrameAudio,
  pal: PaletteDef,
) => {
  if (alpha <= 0.01) return;
  switch (theme) {
    case 'stars': {
      for (let i = 0; i < 60; i++) {
        const P = PARTS[i];
        const tw = (Math.sin(frame * 0.07 + P.p * 20) + 1) / 2;
        const r = (2 + P.s * 8) * tw * (0.6 + a.high);
        ctx.fillStyle = rgba(i % 2 ? pal.accent : '#ffffff', 0.85 * alpha);
        drawStar(ctx, P.x * WIDTH, P.y * HEIGHT, r + 1);
      }
      break;
    }
    case 'rain': {
      // Dew droplets falling.
      for (let i = 0; i < 110; i++) {
        const P = PARTS[i];
        const speed = 16 + P.s * 22;
        const y = mod(P.y * HEIGHT * 2 + frame * speed, HEIGHT + 300) - 150;
        const x = P.x * WIDTH + y * 0.05;
        const len = speed * 2.2;
        ctx.strokeStyle = rgba(pal.accent, 0.55 * alpha);
        ctx.lineWidth = 2.5 + P.s * 3;
        ctx.beginPath();
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = rgba('#ffffff', 0.8 * alpha);
        ctx.beginPath();
        ctx.arc(x, y, 3 + P.s * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'petals': {
      const cols = [pal.c1, pal.c2, pal.accent];
      for (let i = 0; i < 70; i++) {
        const P = PARTS[i];
        const y = mod(P.y * HEIGHT + frame * (2.2 + P.s * 3.2), HEIGHT + 200) - 100;
        const x = P.x * WIDTH + Math.sin(frame * 0.03 + P.p * 10) * 80;
        ctx.fillStyle = rgba(cols[i % 3], 0.7 * alpha);
        ctx.beginPath();
        ctx.ellipse(x, y, 12 + 10 * P.s, 6 + 5 * P.s, frame * 0.04 + P.p * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'sparks': {
      for (let i = 0; i < 80; i++) {
        const P = PARTS[i];
        const sp = 4 + P.s * 9;
        const y = HEIGHT - mod(P.y * HEIGHT + frame * sp, HEIGHT + 100) + 50;
        const x = P.x * WIDTH + Math.sin(frame * 0.05 + P.p * 9) * 30;
        ctx.strokeStyle = rgba(pal.accent, 0.5 * alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + sp * 3);
        ctx.stroke();
        ctx.fillStyle = rgba(pal.accent, 0.85 * alpha);
        ctx.beginPath();
        ctx.arc(x, y, 2 + P.s * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'hearts': {
      for (let i = 0; i < 40; i++) {
        const P = PARTS[i];
        const y = HEIGHT - mod(P.y * HEIGHT + frame * (1.6 + P.s * 2.6), HEIGHT + 160) + 80;
        const x = P.x * WIDTH + Math.sin(frame * 0.03 + P.p * 8) * 50;
        const k = 0.6 + P.s * 0.9 + 0.2 * a.kick;
        ctx.fillStyle = rgba(i % 2 ? pal.c1 : pal.c2, 0.55 * alpha);
        ctx.beginPath();
        HEART_POINTS.forEach(([hx, hy], j) => {
          if (j === 0) ctx.moveTo(x + hx * k, y + hy * k);
          else ctx.lineTo(x + hx * k, y + hy * k);
        });
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    default:
      break;
  }
};

// Particle explosions fired when a line lands.
const drawBursts = (
  ctx: Ctx2D,
  frame: number,
  bursts: Array<{frame: number; kind: Burst}>,
  pal: PaletteDef,
) => {
  const cols = [pal.accent, pal.c1, pal.c2, '#ffffff'];
  for (const b of bursts) {
    const age = frame - b.frame;
    if (age < 0 || age >= 70) continue;
    const alpha = 1 - age / 70;
    for (let j = 0; j < 46; j++) {
      const k = `b${b.frame}${j}`;
      const ang = random(`${k}a`) * Math.PI * 2;
      const sp = 8 + random(`${k}s`) * 26;
      const dist = (sp * (1 - Math.exp(-age * 0.09))) / 0.09;
      const x = WIDTH / 2 + Math.cos(ang) * dist;
      const y = CENTER_Y + Math.sin(ang) * dist + 0.5 * 0.35 * age * age;
      const col = cols[j % cols.length];
      ctx.fillStyle = rgba(col, alpha * 0.9);
      ctx.strokeStyle = rgba(col, alpha * 0.9);
      if (b.kind === 'shatter') {
        const size = 14 + random(`${k}z`) * 34;
        const rot = random(`${k}q`) * 6.28 + age * 0.15 * (j % 2 ? 1 : -1);
        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
          const ra = rot + v * 2.094;
          const rr = size * (v === 0 ? 1 : 0.55);
          ctx.lineTo(x + Math.cos(ra) * rr, y + Math.sin(ra) * rr);
        }
        ctx.closePath();
        ctx.fill();
      } else if (b.kind === 'sparks') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - Math.cos(ang) * 28, y - Math.sin(ang) * 28);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.kind === 'petals') {
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 9, ang + age * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // confetti
        const w = 10 + random(`${k}w`) * 14;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(random(`${k}r`) * 6.28 + age * 0.2);
        ctx.fillRect(-w / 2, -w / 4, w, w / 2);
        ctx.restore();
      }
    }
  }
};

// Tiny sparks on every hi-hat / snare hit.
const drawHatSparks = (ctx: Ctx2D, frame: number, hatHits: number[], pal: PaletteDef) => {
  for (const h of hatHits) {
    const age = frame - h;
    if (age < 0 || age >= 16) continue;
    const alpha = 1 - age / 16;
    for (let j = 0; j < 6; j++) {
      const k = `h${h}${j}`;
      const ox = WIDTH * (0.15 + 0.7 * random(`${k}x`));
      const oy = HEIGHT * (0.25 + 0.45 * random(`${k}y`));
      const ang = random(`${k}a`) * Math.PI * 2;
      const d = (6 + random(`${k}s`) * 14) * age;
      ctx.fillStyle = rgba(j % 2 ? pal.accent : '#ffffff', alpha * 0.9);
      ctx.beginPath();
      ctx.arc(ox + Math.cos(ang) * d, oy + Math.sin(ang) * d, 2 + (1 - age / 16) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const ParticleCanvas: React.FC<{
  frame: number;
  a: FrameAudio;
  pal: PaletteDef;
  prevPal: PaletteDef;
  pp: number;
  theme: Theme;
  prevTheme: Theme;
  bursts: Array<{frame: number; kind: Burst}>;
  hatHits: number[];
}> = ({frame, a, pal, prevPal, pp, theme, prevTheme, bursts, hatHits}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.globalCompositeOperation = 'lighter';
    drawDust(ctx, frame, a, pal);
    if (prevTheme !== theme && pp < 1) drawTheme(ctx, prevTheme, frame, 1 - pp, a, prevPal);
    drawTheme(ctx, theme, frame, prevTheme !== theme ? pp : 1, a, pal);
    drawBursts(ctx, frame, bursts, pal);
    drawHatSparks(ctx, frame, hatHits, pal);
  });
  return (
    <canvas
      ref={ref}
      width={WIDTH}
      height={HEIGHT}
      style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT}}
    />
  );
};

// ---------------------------------------------------------------------------
// Film grain: low-res noise regenerated at 30 fps, scaled up, overlay-blended
// ---------------------------------------------------------------------------
const GW = 270;
const GH = 480;

export const Grain: React.FC<{frame: number}> = ({frame}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(GW, GH);
    let s = ((Math.floor(frame / 2) + 1) * 2654435761) >>> 0;
    for (let i = 0; i < GW * GH; i++) {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      const v = s & 255;
      const o = i * 4;
      img.data[o] = v;
      img.data[o + 1] = v;
      img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  return (
    <canvas
      ref={ref}
      width={GW}
      height={GH}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: WIDTH,
        height: HEIGHT,
        imageRendering: 'pixelated',
        mixBlendMode: 'overlay',
        opacity: 0.18,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Reactive background: gradient mesh + beat grid + particles
// ---------------------------------------------------------------------------
export const Background: React.FC<{
  frame: number;
  a: FrameAudio;
  pal: PaletteDef;
  prevPal: PaletteDef;
  pp: number;
  theme: Theme;
  prevTheme: Theme;
  bursts: Array<{frame: number; kind: Burst}>;
  hatHits: number[];
}> = ({frame, a, pal, prevPal, pp, theme, prevTheme, bursts, hatHits}) => {
  const mix = (k: 'c1' | 'c2' | 'c3' | 'base' | 'accent') =>
    interpolateColors(pp, [0, 1], [prevPal[k], pal[k]]);
  const c1 = mix('c1');
  const c2 = mix('c2');
  const c3 = mix('c3');
  const base = mix('base');
  const accent = mix('accent');

  const t = frame / 60;
  const mesh = [
    `radial-gradient(60% 40% at ${50 + 32 * Math.sin(t * 0.7)}% ${22 + 14 * Math.cos(t * 0.5)}%, ${c1} 0%, transparent 70%)`,
    `radial-gradient(55% 38% at ${25 + 25 * Math.cos(t * 0.45)}% ${62 + 16 * Math.sin(t * 0.6)}%, ${c2} 0%, transparent 70%)`,
    `radial-gradient(55% 38% at ${78 + 14 * Math.sin(t * 0.8)}% ${70 + 14 * Math.cos(t * 0.4)}%, ${c3} 0%, transparent 70%)`,
    `linear-gradient(180deg, ${base} 0%, #05010b 100%)`,
  ].join(', ');

  return (
    <AbsoluteFill style={{backgroundColor: '#05010b', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: mesh,
          opacity: 0.55 + 0.4 * a.bass,
          transform: `scale(${1.08 + 0.05 * a.kick})`,
        }}
      />
      {/* Flat grid, pulses on the kick */}
      <AbsoluteFill
        style={{
          opacity: 0.1 + 0.35 * a.kick,
          backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
          backgroundSize: '90px 90px',
          backgroundPosition: `0px ${(frame * 0.6) % 90}px`,
        }}
      />
      {/* Perspective floor grid rushing toward the camera */}
      <div
        style={{
          position: 'absolute',
          left: '-50%',
          width: '200%',
          bottom: 0,
          height: '56%',
          transformOrigin: '50% 100%',
          transform: 'perspective(700px) rotateX(62deg)',
          backgroundImage: `linear-gradient(${accent} 2px, transparent 2px), linear-gradient(90deg, ${accent} 2px, transparent 2px)`,
          backgroundSize: '120px 120px',
          backgroundPosition: `0px ${frame * 3}px`,
          opacity: 0.12 + 0.5 * a.kick,
          WebkitMaskImage: 'linear-gradient(to top, #000, transparent 85%)',
          maskImage: 'linear-gradient(to top, #000, transparent 85%)',
        }}
      />
      <ParticleCanvas
        frame={frame}
        a={a}
        pal={pal}
        prevPal={prevPal}
        pp={pp}
        theme={theme}
        prevTheme={prevTheme}
        bursts={bursts}
        hatHits={hatHits}
      />
    </AbsoluteFill>
  );
};
