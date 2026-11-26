# Qaabil-E-Taareef lyric video (Remotion, 1080x1920 @ 60 fps)

Beat-synced, audio-reactive lyric video for the 0:25 - 1:08 section of `public/song.mp3`.

## Run it

```bash
npm i
npx remotion studio        # open the "LyricVideo" composition
npx remotion render LyricVideo out/lyric-video.mp4   # when you're happy
```

Fonts (Anton + Playfair Display Italic) load from Google Fonts, so the first run needs internet.
If `npm i` complains about versions, scaffold a fresh project with
`npx create-video@latest --blank` and copy `src/` and `public/` into it.

## Where things live

| File | What it does |
| --- | --- |
| `src/lyrics.ts` | Every lyric line: text, English meaning, why each effect was chosen, start beat, transition, palette, particle theme, effects. **Edit timings here** (`startBeat`). |
| `src/config.ts` | fps, audio window, tempo grid, FFT size, frequency bands (in Hz), fonts. |
| `src/audio.tsx` | `useAudioData` + `visualizeAudio` on every frame, band normalisation, kick / hat / vocal / strobe detection. |
| `src/transitions.tsx` | 10-frame spring transitions (whip-pan + directional blur, Z-push, 3D flips). |
| `src/Words.tsx` | Kinetic typography, RGB split, glow, letter expansion, match-cut anchors. |
| `src/Effects.tsx` | Shockwaves, strobe, glitch slices, speed lines, lens flare, rays, heart, focus rings, RGB tears, scanlines, bokeh, sparkles. |
| `src/Background.tsx` | Gradient mesh, beat-pulsing grids, canvas particles and bursts, film grain. |

## Audio mapping

- Sub-bass 30-140 Hz: `bassScale` punch (1.0 to 1.12), shockwave rings, camera shake, grid pulse.
- Vocals 300-3400 Hz: text glow, RGB split, letter expansion.
- Highs 5-12 kHz: particle sparks, glitch slices, strobe, RGB tears.

## Notes

- Line timings were estimated from the beat grid, not forced-aligned to the vocal. Retune `startBeat` by ear.
- The strobe is capped at 2 flashes per second at low opacity (photosensitivity).
