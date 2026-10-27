// Soundtrack for next-video.html: crisp mechanical clicks, assembly ticks, servo whirs and
// whooshes over a 110 bpm beat that drops when the first option lands.
async function renderSoundtrack(sr = 48000) {
  const ac = new OfflineAudioContext(2, Math.ceil(sr * DURATION), sr);
  const r = rng(2468);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
  const master = ac.createGain(); master.gain.value = 0.9;
  master.connect(comp); comp.connect(ac.destination);

  const verb = ac.createConvolver();
  const ir = ac.createBuffer(2, sr * 1.8, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / d.length, 3.5);
  }
  verb.buffer = ir;
  const verbGain = ac.createGain(); verbGain.gain.value = 0.22;
  verb.connect(verbGain); verbGain.connect(master);

  const noiseBuf = ac.createBuffer(1, sr * 2, sr);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;

  function out(node, pan = 0, wet = 0.15) {
    const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
    node.connect(p); p.connect(master);
    if (wet > 0) { const s = ac.createGain(); s.gain.value = wet; p.connect(s); s.connect(verb); }
  }
  function tone(t, { type = 'sine', f, f1 = f, dur, gain, attack = 0.002, pan = 0, wet = 0.15, glide = dur }) {
    if (t < 0 || t > DURATION) return;
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f, t); if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1, t + glide);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, pan, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, { dur, gain, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, attack = 0.002, pan = 0, wet = 0.15, am = 0 }) {
    if (t < 0 || t > DURATION) return;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let src = fl;
    if (am) {                                    // amplitude chop, for rotor blade passes
      const chop = ac.createGain(); chop.gain.value = 0.5;
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = am; lg.gain.value = 0.5; l.connect(lg); lg.connect(chop.gain); l.start(t); l.stop(t + dur + 0.05);
      fl.connect(chop); src = chop;
    }
    s.connect(fl); src.connect(g); out(g, pan, wet); s.start(t, r() * 1.5); s.stop(t + dur + 0.05);
  }

  // ---- sound palette ----
  const click = (t, vol = 1, pan = 0) => {               // crisp mechanical key click
    noise(t, { dur: 0.012, gain: 0.3 * vol, type: 'highpass', f0: 4000, pan, wet: 0.05 });
    tone(t, { f: 2600, f1: 1800, dur: 0.018, gain: 0.06 * vol, pan, wet: 0.05 });
    tone(t, { f: 170, f1: 90, dur: 0.04, gain: 0.18 * vol, pan, wet: 0 });
  };
  const tick = (t, f = 1800, vol = 1, pan = 0) => tone(t, { type: 'triangle', f, dur: 0.025, gain: 0.05 * vol, pan, wet: 0.05 });
  const blip = (t, f, vol = 1, pan = 0) => {
    tone(t, { f, f1: f * 1.5, dur: 0.12, gain: 0.16 * vol, glide: 0.05, pan, wet: 0.2 });
    tone(t, { type: 'triangle', f: f * 2, dur: 0.06, gain: 0.04 * vol, pan, wet: 0.2 });
  };
  const thump = (t, vol = 1) => {
    tone(t, { f: 130, f1: 45, dur: 0.45, gain: 0.7 * vol, glide: 0.18, wet: 0.1 });
    noise(t, { dur: 0.06, gain: 0.2 * vol, type: 'highpass', f0: 2500, wet: 0.1 });
  };
  const whoosh = (t, dur, vol = 1) => noise(t, { dur, gain: 0.4 * vol, f0: 300, f1: 4200, q: 1.3, attack: dur * 0.7, wet: 0.25 });
  const servo = (t, dur, vol = 1) => {                   // motor spinning up
    tone(t, { type: 'sawtooth', f: 70, f1: 260, dur, gain: 0.05 * vol, attack: 0.15, wet: 0.1 });
    tone(t, { type: 'square', f: 140, f1: 520, dur, gain: 0.015 * vol, attack: 0.15, wet: 0.1 });
    noise(t, { dur, gain: 0.08 * vol, f0: 600, f1: 2400, q: 4, attack: 0.2, wet: 0.1 });
  };

  // ---- beat: drops with the first option ----
  const beat = 60 / 110, bar = beat * 4, start = T.opts[0], stop = DURATION - 0.6;
  const BASS = [55, 43.65, 65.41, 49];
  for (let b = 0, t0 = start; t0 < stop; b++, t0 += beat) {
    tone(t0, { f: 150, f1: 42, dur: 0.32, gain: 0.55, glide: 0.1, wet: 0 });                        // kick
    if (b % 2 === 1) noise(t0, { dur: 0.16, gain: 0.22, f0: 1800, q: 0.8, wet: 0.25 });            // clap
    noise(t0 + beat / 2, { dur: 0.035, gain: 0.07, type: 'highpass', f0: 8000, wet: 0.05 });       // hat
    const f = BASS[Math.floor(b / 4) % 4];
    [0, 0.5].forEach(o => {
      const tt = t0 + o * beat;
      const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4;
      lp.frequency.setValueAtTime(900, tt); lp.frequency.exponentialRampToValueAtTime(160, tt + beat * 0.45);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.12, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + beat * 0.48);
      osc.connect(lp); lp.connect(g); out(g, 0, 0.05); osc.start(tt); osc.stop(tt + beat * 0.5);
    });
  }
  // hook pad + riser into the drop
  [110, 164.8, 220].forEach(f => tone(0.1, { type: 'triangle', f, dur: 2.8, gain: 0.025, attack: 0.8, wet: 0.4 }));
  noise(1.9, { dur: start - 1.9, gain: 0.3, f0: 400, f1: 7000, q: 2, attack: start - 1.95, wet: 0.3 });
  tone(1.9, { type: 'sawtooth', f: 110, f1: 880, dur: start - 1.9, gain: 0.03, attack: start - 1.95, wet: 0.3 });
  thump(start, 1.2);

  // ---- hook ----
  'WHAT SHOULD I'.split('').forEach((ch, i) => ch !== ' ' && click(0.37 + i * 0.045, 0.8, (i / 12 - 0.5) * 0.6));
  'ANIMATE NEXT?'.split('').forEach((ch, i) => ch !== ' ' && click(0.37 + (13 + i) * 0.045, 0.9, (i / 12 - 0.5) * 0.6));
  tick(1.35, 1200, 2); tick(1.5, 1600, 2);
  for (let i = 0; i < 11; i++) tick(1.6 + i * 0.036, 2200, 1.4);
  whoosh(2.4, 0.45, 0.8);

  // ---- options ----
  OPTIONS.forEach((opt, i) => {
    const s = T.opts[i];
    if (i > 0) whoosh(s - 0.25, 0.45);
    noise(s, { dur: 0.4, gain: 0.08, f0: 2000, f1: 500, q: 3, wet: 0.2 });                        // scan sweep
    thump(s + 0.45, 0.5); blip(s + 0.45, 660 + i * 110);                                           // badge pop
    for (let k = 0; k < 25; k++) tick(s + 0.15 + k * 0.04, 1000 + k * 60, 0.9, (hash(k + i) - 0.5) * 0.8);   // assembly
    click(s + 0.62, 0.7); click(s + 0.74, 0.7);                                                     // title lines land
    for (let k = 0; k < 8; k++) tick(s + 1.0 + k * 0.05, 2400, 0.8);                                // vote line types
    opt.callouts.forEach((_, j) => { click(calloutTime(i, j), 1, j % 2 ? 0.4 : -0.4); for (let k = 0; k < 5; k++) tick(calloutTime(i, j) + 0.15 + k * 0.05, 2600, 0.6); });
    if (i === 0) {                                                                                  // gear: hydraulics up, lock, down, lock
      servo(s + 1.3, 0.8, 0.9); click(s + 2.1, 1.6); thump(s + 2.1, 0.35);
      servo(s + 2.3, 0.7, 0.8); click(s + 3.0, 1.6); thump(s + 3.0, 0.35);
    }
    if (i === 1) { servo(s + 1.3, 0.9, 0.8); click(s + 2.2, 1.4); thump(s + 2.2, 0.3); }          // flap deploys and locks
    if (i === 2) { servo(s + 1.0, 1.0, 0.7); noise(s + 1.3, { dur: 1.8, gain: 0.3, type: 'lowpass', f0: 400, q: 0.7, attack: 0.3, wet: 0.15, am: 9 }); }
    if (i === 3) [1.45, 1.72, 2.0].forEach((d, k) => { click(s + d, 1.3, k % 2 ? 0.5 : -0.5); tone(s + d, { f: 320, f1: 200, dur: 0.08, gain: 0.15, wet: 0.2 }); });
  });

  // ---- recap ----
  whoosh(T.summary - 0.3, 0.4);
  'WHICHONE'.split('').forEach((_, i) => click(T.summary + 0.07 + i * 0.03, 0.5));
  'SHOULDIMAKE?'.split('').forEach((_, i) => click(T.summary + 0.32 + i * 0.03, 0.5));
  OPTIONS.forEach((_, i) => blip(tileTime(i) + 0.08, [523.3, 659.3, 784, 1046.5][i], 0.9, i % 2 ? 0.4 : -0.4));
  OPTIONS.forEach((_, i) => { click(highlightTime(i), 1.2, i % 2 ? 0.4 : -0.4); blip(highlightTime(i), [784, 880, 988, 1175][i], 0.6); });
  thump(CTA_T, 0.8);
  [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(CTA_T + i * 0.04, { f, dur: 1.6, gain: 0.07, attack: 0.01, wet: 0.4, pan: (i - 1.5) * 0.3 }));

  return ac.startRendering();
}

function audioBufferToWav(buf) {
  const chs = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const data = [];
  let peak = 0;
  for (let c = 0; c < chs; c++) { const d = buf.getChannelData(c); data.push(d); for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i])); }
  const norm = peak > 0 ? 0.89 / peak : 1;
  const bytes = new DataView(new ArrayBuffer(44 + len * chs * 2));
  const str = (o, s) => [...s].forEach((ch, i) => bytes.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF'); bytes.setUint32(4, 36 + len * chs * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  bytes.setUint32(16, 16, true); bytes.setUint16(20, 1, true); bytes.setUint16(22, chs, true);
  bytes.setUint32(24, sr, true); bytes.setUint32(28, sr * chs * 2, true); bytes.setUint16(32, chs * 2, true); bytes.setUint16(34, 16, true);
  str(36, 'data'); bytes.setUint32(40, len * chs * 2, true);
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < chs; c++, o += 2) bytes.setInt16(o, clamp(data[c][i] * norm, -1, 1) * 32767, true);
  const u8 = new Uint8Array(bytes.buffer);
  let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(bin);
}
window.renderAudioWav = async () => audioBufferToWav(await renderSoundtrack(48000));
