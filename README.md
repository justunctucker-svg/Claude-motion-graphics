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

`asap-electric.html` + `asap-audio.js`: a 23-second vertical (1080×1920) ad for Reels, TikTok and Nextdoor, made in the same style with a fully synthesized soundtrack.

| Time | Scene |
| --- | --- |
| 0–4.4s | A lightning strike, then a diagnostics prompt types out *breaker keeps tripping? / lights flickering? / outlet getting hot?* with FAULT DETECTED tags |
| 4.5–7.9s | Fly-through and slams: **DON'T GUESS. / DON'T KEEP RESETTING IT. / CALL A.S.A.P.** |
| 7.9–11s | Lightning hits and the A★S★A★P★ ELECTRIC LLC logo builds itself: Licensed ★ Bonded ★ Insured |
| 11.3–14s | 2026 Nextdoor Fave Winner badge coin-flips in with confetti and a chime |
| 14.2–17s | Service tiles (lighting, breakers, hot outlets, ceiling fans, panel upgrades, surge protection) and a 24/7 Emergency Service stamp |
| 17.2–19.5s | Rotating 3D wireframe house, then a trust checklist |
| 19.6–23s | CTA: a rolling phone number 941-416-7599, CallASAPFlorida.com, Venice FL 34292, the Fave badge, and Safe Homes ★ Stronger Communities |

Sound is generated with Web Audio from the same timeline as the picture: typing clicks, thunder, zaps, whooshes, impacts, chimes, pops and a low pad with a pulse. In the live preview, click once to turn sound on.

```bash
npm run render:asap     # → out/asap-electric.mp4 (with audio)
```
