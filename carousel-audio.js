// Soundtrack for carousel.html: a soft click and glide for each step, plus a signature sound
// as each card lands (fire whoomp, solar shimmer, wind swirl, bloom chimes) over a warm drone.
async function renderSoundtrack(sr = 48000) {
  const ac = new OfflineAudioContext(2, Math.ceil(sr * DURATION), sr);
  const r = rng(777);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
  const master = ac.createGain(); master.gain.value = 0.9;
  const warm = ac.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 9000;
  master.connect(warm); warm.connect(comp); comp.connect(ac.destination);

  const verb = ac.createConvolver();
  const ir = ac.createBuffer(2, sr * 3, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  }
  verb.buffer = ir;
  const verbGain = ac.createGain(); verbGain.gain.value = 0.3;
  verb.connect(verbGain); verbGain.connect(master);

  const noiseBuf = ac.createBuffer(1, sr * 2, sr);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;

  function out(node, pan = 0, wet = 0.2) {
    const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
    node.connect(p); p.connect(master);
    if (wet > 0) { const s = ac.createGain(); s.gain.value = wet; p.connect(s); s.connect(verb); }
  }
  function tone(t, { type = 'sine', f, f1 = f, dur, gain, attack = 0.005, pan = 0, wet = 0.2 }) {
    if (t < 0 || t > DURATION) return;
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f, t); if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, pan, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, { dur, gain, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, attack = 0.005, pan = 0, wet = 0.2, lfo = 0 }) {
    if (t < 0 || t > DURATION) return;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (lfo) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = lfo; lg.gain.value = f0 * 0.5; l.connect(lg); lg.connect(fl.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); out(g, pan, wet); s.start(t, r() * 1.5); s.stop(t + dur + 0.05);
  }

  // ---- signature sounds ----
  const SOUNDS = {
    Ember: t => {
      noise(t, { dur: 0.9, gain: 0.5, type: 'lowpass', f0: 300, f1: 2400, q: 0.8, attack: 0.12, wet: 0.3 });  // whoomp
      tone(t, { f: 110, f1: 55, dur: 0.7, gain: 0.35, attack: 0.03, wet: 0.2 });
      for (let i = 0; i < 40; i++) {                                                                       // crackle
        noise(t + 0.2 + r() * 2.6, { dur: 0.015 + r() * 0.02, gain: 0.08 + r() * 0.12, type: 'highpass', f0: 2500 + r() * 2500, pan: r() * 1.2 - 0.6, wet: 0.15 });
      }
      noise(t + 0.3, { dur: 2.6, gain: 0.07, type: 'bandpass', f0: 500, q: 0.6, attack: 0.4, wet: 0.2 });     // low roar
    },
    Solar: t => {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(t + i * 0.05, { f, dur: 2.4, gain: 0.07, attack: 0.25, pan: (i - 1.5) * 0.3, wet: 0.5 }));
      tone(t, { type: 'triangle', f: 261.6, dur: 2.0, gain: 0.06, attack: 0.3, wet: 0.4 });
      for (let i = 0; i < 14; i++) tone(t + 0.15 + i * 0.05, { f: 1800 + r() * 2200, dur: 0.25, gain: 0.025, pan: r() * 2 - 1, wet: 0.6 });  // shimmer
      noise(t, { dur: 0.8, gain: 0.12, type: 'bandpass', f0: 1500, f1: 6000, q: 1.5, attack: 0.5, wet: 0.4 });
    },
    Breeze: t => {
      noise(t, { dur: 2.8, gain: 0.3, type: 'bandpass', f0: 900, f1: 600, q: 2.5, attack: 0.6, wet: 0.4, lfo: 1.6 });
      noise(t + 0.1, { dur: 2.4, gain: 0.15, type: 'bandpass', f0: 1800, f1: 1100, q: 4, attack: 0.7, pan: 0.4, wet: 0.4, lfo: 2.3 });
      tone(t, { f: 392, dur: 2.2, gain: 0.04, attack: 0.5, wet: 0.5 });
      tone(t, { f: 587.3, dur: 2.2, gain: 0.03, attack: 0.6, wet: 0.5 });
    },
    Bloom: t => {
      [659.3, 830.6, 987.8, 1318.5, 987.8, 1318.5].forEach((f, i) => {                                  // harp-like chimes
        tone(t + 0.08 + i * 0.09, { f, dur: 1.6, gain: 0.1, attack: 0.004, pan: (i % 2 ? 0.3 : -0.3), wet: 0.5 });
        tone(t + 0.08 + i * 0.09, { f: f * 2, dur: 0.5, gain: 0.02, attack: 0.004, wet: 0.5 });
      });
      tone(t, { f: 329.6, dur: 2.6, gain: 0.06, attack: 0.4, wet: 0.4 });
      noise(t, { dur: 0.7, gain: 0.08, type: 'lowpass', f0: 400, f1: 1500, attack: 0.3, wet: 0.4 });
    },
  };

  // ---- warm drone bed across the whole piece ----
  [55, 82.41, 110].forEach((f, i) => {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, 0); g.gain.linearRampToValueAtTime(0.02 / (1 + i * 0.4), 1);
    g.gain.setValueAtTime(0.02 / (1 + i * 0.4), DURATION - 1); g.gain.linearRampToValueAtTime(0.0001, DURATION);
    o.connect(lp); lp.connect(g); out(g, (i - 1) * 0.4, 0.3); o.start(0); o.stop(DURATION);
  });

  // ---- events: same timeline as the picture, repeated each loop ----
  for (let base = 0; base < DURATION - 0.01; base += LOOP) {
    for (let s = 0; s < OPTIONS.length; s++) {
      const opt = OPTIONS[s];
      SOUNDS[opt.name](base + arrival(s) + 0.03);
      const c = base + clickTime(s);
      noise(c, { dur: 0.03, gain: 0.25, type: 'highpass', f0: 3000, wet: 0.05 });                        // click
      tone(c, { f: 1200, f1: 700, dur: 0.05, gain: 0.08, wet: 0.05 });
      const g0 = base + s * SEG + SEG - SLIDE;
      noise(g0, { dur: SLIDE + 0.1, gain: 0.18, type: 'bandpass', f0: 300, f1: 1800, q: 1.2, attack: SLIDE * 0.6, wet: 0.3 });  // glide
    }
  }
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
