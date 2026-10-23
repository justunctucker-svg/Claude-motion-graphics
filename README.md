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
