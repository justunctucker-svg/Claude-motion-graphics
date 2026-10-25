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

### Senior-friendly version

`asap-electric-friendly.html` + `asap-audio-friendly.js`: a calmer 39-second cut aimed at older homeowners. It reuses the logo, badge, icons, owner and van.

- Big upright bold type (body text 44px and up, headlines around 80px), high contrast, and one idea per screen.
- Slow fades and slides. No lightning flashes, flicker, glitch letters, camera shake or speed lines.
- Plain-language problem cards instead of the "diagnostics" terminal.
- **CALL 941-416-7599** stays on screen from 2.5s until the final call-to-action, which holds for 7s.
- A warm electric-piano bed (C–G–Am–F at 76 bpm) with soft marimba and bell cues, rolled off above 6 kHz with no booms or hiss.

```bash
npm run render:asap-friendly   # → out/asap-electric-friendly.mp4
```

---

# Element carousel

`carousel.html` + `carousel-audio.js`: a 1920×1080 loop of four glowing pill cards (**Ember, Solar, Breeze, Bloom**). A cursor clicks the next card, the carousel glides over, and the card that lands plays its own effect:

- **Ember:** catches fire, with flames and rising sparks
- **Solar:** a gold rim draws itself on and sun rays burst out behind the card
- **Breeze:** wind streaks swirl around the card
- **Bloom:** lotus petals unfold behind and in front of the card

The background and floor light shift to each card's color, and everything reflects on the floor. Each effect has a matching sound (fire whoomp and crackle, solar shimmer, wind swirl, harp-like chimes) along with a click and a glide on every step. One loop is 14s and loops seamlessly; the render plays it twice (28s).

```bash
npm run render:carousel   # → out/carousel.mp4
```

To change the cards, edit `OPTIONS` at the top of `carousel.html`.
