import {spring} from 'remotion';
import {HEIGHT, TR_FRAMES, WIDTH} from './config';
import type {TransitionKind} from './lyrics';
import {clamp} from './utils';

export type Xform = {
  /** CSS transform fragment (no perspective). */
  t: string;
  /** Opacity multiplier. */
  o: number;
  /** Directional blur (px) along X / Y, plus isotropic blur. */
  bx: number;
  by: number;
  bi: number;
  /** Needs a perspective() in front of the transform. */
  persp: boolean;
};

const ID: Xform = {t: '', o: 1, bx: 0, by: 0, bi: 0, persp: false};

/**
 * Transition progress: spring({damping: 12, stiffness: 200}) stretched to a
 * 10-frame overlap. `clampOvershoot` is used for exits so they stay monotonic.
 */
export const trProgress = (
  frame: number,
  at: number,
  fps: number,
  clampOvershoot: boolean,
) =>
  spring({
    frame: Math.max(0, frame - at),
    fps,
    durationInFrames: TR_FRAMES,
    config: {damping: 12, stiffness: 200, overshootClamping: clampOvershoot},
  });

/** Transform for the INCOMING scene. p: 0 -> 1 (may overshoot slightly). */
export const enterXform = (kind: TransitionKind, p: number): Xform => {
  const r = 1 - p;
  const rp = Math.max(0, r);
  switch (kind) {
    case 'whipLeft':
      return {...ID, t: `translate3d(${r * WIDTH * 1.15}px, 0, 0)`, bx: rp * 120};
    case 'whipRight':
      return {...ID, t: `translate3d(${-r * WIDTH * 1.15}px, 0, 0)`, bx: rp * 120};
    case 'whipUp':
      return {...ID, t: `translate3d(0, ${r * HEIGHT * 0.95}px, 0)`, by: rp * 120};
    case 'whipDown':
      return {...ID, t: `translate3d(0, ${-r * HEIGHT * 0.95}px, 0)`, by: rp * 120};
    case 'zPush':
      // The new phrase waits behind the old one and settles forward.
      return {...ID, t: `scale(${0.7 + 0.3 * p})`, bi: rp * 14};
    case 'zPull':
      return {...ID, t: `scale(${1 + r * 5})`, o: clamp(p * 5), bi: rp * 22};
    case 'flipY':
      return {
        ...ID,
        t: `rotateY(${-90 * r}deg)`,
        o: r > 0.98 ? 0 : 1,
        persp: true,
        bi: rp * 5,
      };
    case 'flipX':
      return {
        ...ID,
        t: `rotateX(${-90 * r}deg)`,
        o: r > 0.98 ? 0 : 1,
        persp: true,
        bi: rp * 5,
      };
    default:
      return ID;
  }
};

/** Transform for the OUTGOING scene. q: 0 -> 1 (clamped). */
export const exitXform = (kind: TransitionKind, q: number): Xform => {
  switch (kind) {
    case 'whipLeft':
      return {...ID, t: `translate3d(${-q * WIDTH * 1.15}px, 0, 0)`, bx: q * 120};
    case 'whipRight':
      return {...ID, t: `translate3d(${q * WIDTH * 1.15}px, 0, 0)`, bx: q * 120};
    case 'whipUp':
      return {...ID, t: `translate3d(0, ${-q * HEIGHT * 0.95}px, 0)`, by: q * 120};
    case 'whipDown':
      return {...ID, t: `translate3d(0, ${q * HEIGHT * 0.95}px, 0)`, by: q * 120};
    case 'zPush':
      // Camera flies straight through the old phrase: scale 1 -> 8, opacity 1 -> 0.
      return {...ID, t: `scale(${1 + 7 * q})`, o: 1 - q, bi: q * 18};
    case 'flipY':
      return {...ID, t: `rotateY(${90 * q}deg)`, o: q > 0.98 ? 0 : 1, persp: true, bi: q * 5};
    case 'flipX':
      return {...ID, t: `rotateX(${90 * q}deg)`, o: q > 0.98 ? 0 : 1, persp: true, bi: q * 5};
    default:
      return ID;
  }
};
