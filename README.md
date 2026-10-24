# Claude motion graphics

A 15-second cinematic motion-graphics sequence built entirely in code (HTML canvas), with no After Effects and no keyframes.

**Sequence**
1. A 3D perspective grid fades in and a prompt panel draws itself.
2. The prompt types out with glitchy kinetic typography: scrambled glyphs, RGB split, the live word in orange, an attention reticle and a next-token readout.
3. Wireframe 3D props spin in when "3D elements" gets typed.
4. Enter → flash → the letters explode and the camera flies through the grid.
5. Kinetic slams: **NO KEYFRAMES. / NO TIMELINE. / JUST A PROMPT.**
6. End card: a rotating wireframe icosahedron with an orange spark and the **MOTION GRAPHICS** title.

## Preview live
Open `index.html` in a browser. Keys: `space` pauses, `←/→` steps a frame (hold shift to step 1s), `r` restarts.

## Render to MP4
Needs Node and ffmpeg.
```bash
npm install
npx playwright install chromium
npm run render      # → out/motion.mp4 (1920×1080, 30fps)
npm run preview     # → out/preview.mp4 (small, quick)
```

Every frame is a pure function of time (`renderFrame(t)`), so the render is deterministic. To change the text, edit `PROMPT` or `SLAMS` in `index.html`. Colors live in `ORANGE` / `INK`, and camera moves are in `camAt(t)`.

---

# A.S.A.P. Electric LLC spot

`asap-electric.html` + `asap-audio.js`: a 24.6-second vertical (1080×1920) ad for Reels, TikTok and Nextdoor, made in the same style with a fully synthesized soundtrack.

| Time | Scene |
| --- | --- |
| 0–4.4s | A lightning strike, then a diagnostics prompt types out *breaker keeps tripping? / lights flickering? / outlet getting hot?* with FAULT DETECTED tags |
| 4.5–7.9s | Fly-through and slams: **DON'T GUESS. / DON'T KEEP RESETTING IT. / CALL A.S.A.P.** |
| 7.9–11s | Lightning hits and the A★S★A★P★ ELECTRIC LLC logo builds itself: Licensed ★ Bonded ★ Insured |
| 11.3–14s | 2026 Nextdoor Fave Winner badge coin-flips in with confetti and a chime |
| 14.2–17s | Service tiles (lighting, breakers, hot outlets, ceiling fans, panel upgrades, surge protection) and a 24/7 Emergency Service stamp |
| 17.2–21.2s | The van drives in and brakes with a bounce, the owner scans in behind it, "Local. Family-Owned. Real Answers." pops in, and a checklist ticks off over a wireframe house |
| 21.2–24.6s | CTA: a rolling phone number 941-416-7599, CallASAPFlorida.com, Venice FL 34292, the Fave badge, and Safe Homes ★ Stronger Communities |

Sound is generated with Web Audio from the same timeline as the picture: typing clicks, thunder, zaps, whooshes, impacts, chimes, pops and a low pad with a pulse. In the live preview, click once to turn sound on.

```bash
npm run render:asap     # → out/asap-electric.mp4 (with audio)
```

`assets/man.png` and `assets/van.png` are cutouts taken from the company's flyers (background removed with rembg).

### Retro arcade sound version

Add `?sfx=retro` to the page (or run `npm run render:asap-retro`) and the same video plays with an 8-bit arcade sound set from `asap-sfx-retro.js`. Typing becomes chomp blips, lightning becomes a crunchy explosion and laser zap, fly-throughs become diving sirens, slams become stepped booms, pops become coin pickups, checks become power-ups, and the badge and phone number get a short level-clear fanfare. The sounds are original chip-style synthesis inspired by early-'80s arcade cabinets. No game audio is sampled or copied.
