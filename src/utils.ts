export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.min(hi, Math.max(lo, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export const mod = (n: number, m: number) => ((n % m) + m) % m;

export const rgba = (hex: string, alpha: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${clamp(alpha)})`;
};

// Unit heart outline (x in [-16,16], y in [-17,12]); scale it when drawing.
export const HEART_POINTS: ReadonlyArray<readonly [number, number]> = Array.from(
  {length: 72},
  (_, i) => {
    const t = (i / 72) * Math.PI * 2;
    return [
      16 * Math.pow(Math.sin(t), 3),
      -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      ),
    ] as const;
  },
);

export const heartPath = (scale: number) =>
  HEART_POINTS.map(
    ([x, y], i) => `${i === 0 ? 'M' : 'L'}${(x * scale).toFixed(1)} ${(y * scale).toFixed(1)}`,
  ).join(' ') + ' Z';
