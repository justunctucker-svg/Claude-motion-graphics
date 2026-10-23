// Renders index.html frame-by-frame with headless Chromium and pipes it into ffmpeg.
// Usage: node render.js [out.mp4] [--fps 30] [--preview]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const out = args.find(a => a.endsWith('.mp4')) || 'out/motion.mp4';
const fpsArg = args.indexOf('--fps');
const fps = fpsArg >= 0 ? Number(args[fpsArg + 1]) : 30;
const preview = args.includes('--preview');

(async () => {
  require('fs').mkdirSync(path.dirname(out), { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html') + '?render');
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);
  const total = Math.round(duration * fps);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    ...(preview ? ['-vf', 'scale=960:-2'] : []),
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
  console.log(`\nwrote ${out}`);
})();
