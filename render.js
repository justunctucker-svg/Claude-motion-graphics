// Renders a scene page frame-by-frame with headless Chromium and pipes it into ffmpeg.
// If the page exposes window.renderAudioWav(), its soundtrack is muxed in too.
// Usage: node render.js [page.html] [out.mp4] [--fps 30] [--preview]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pageFile = args.find(a => a.endsWith('.html')) || 'index.html';
const out = args.find(a => a.endsWith('.mp4')) || `out/${path.basename(pageFile, '.html')}.mp4`;
const fpsArg = args.indexOf('--fps');
const fps = fpsArg >= 0 ? Number(args[fpsArg + 1]) : 30;
const preview = args.includes('--preview');

(async () => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.resolve(__dirname, pageFile) + '?render');
  await page.evaluate(() => window.ready);
  const { width, height, duration, hasAudio } = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { width: c.width, height: c.height, duration: window.DURATION, hasAudio: typeof window.renderAudioWav === 'function' };
  });
  await page.setViewportSize({ width, height });
  const total = Math.round(duration * fps);

  let wav = null;
  if (hasAudio) {
    wav = out.replace(/\.mp4$/, '.wav');
    fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.renderAudioWav()), 'base64'));
  }

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    ...(wav ? ['-i', wav, '-af', 'loudnorm=I=-14:TP=-1:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest'] : []),
    ...(preview ? ['-vf', 'scale=iw/2:-2'] : []),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', preview ? '28' : '16', '-preset', 'slow', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });

  const canvas = await page.$('canvas');
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.renderFrame(t), f / fps);
    const png = await canvas.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % fps === 0) process.stdout.write(`\rframe ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`\nwrote ${out}${wav ? ' (with audio)' : ''}`);
})();
