// Soundtrack for asap-electric.html, synthesized with Web Audio from the same timeline
// as the picture (T, chars, SURGES, ...), so every hit lands on its frame.
async function renderSoundtrack(sr = 48000) {
  const ac = new OfflineAudioContext(2, Math.ceil(sr * DURATION), sr);
  const r = rng(1234);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  const master = ac.createGain(); master.gain.value = 0.9;
  master.connect(comp); comp.connect(ac.destination);

  // small generated room for a bit of tail
  const verb = ac.createConvolver();
  const ir = ac.createBuffer(2, sr * 2.2, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / d.length, 3);
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
  function envelope(g, t, gain, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(t, { type = 'sine', f0, f1 = f0, dur, gain, attack = 0.002, pan = 0, wet = 0.15, glide = dur }) {
    if (t < 0) return;
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + glide);
    const g = ac.createGain(); envelope(g, t, gain, attack, dur);
    o.connect(g); out(g, pan, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, { dur, gain, type = 'bandpass', f0 = 1000, f1 = f0, q = 1, attack = 0.002, pan = 0, wet = 0.15 }) {
    if (t < 0) return;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); envelope(g, t, gain, attack, dur);
    s.connect(fl); fl.connect(g); out(g, pan, wet); s.start(t, r() * 1.5); s.stop(t + dur + 0.05);
  }

  // ---- sound palette ----
  const click = (t, pan = 0, vol = 1) => {
    noise(t, { dur: 0.03, gain: 0.22 * vol, type: 'highpass', f0: 2500, q: 0.7, pan, wet: 0.04 });
    tone(t, { f0: 190, f1: 90, dur: 0.045, gain: 0.12 * vol, pan, wet: 0 });
  };
  const thunder = (t, vol = 1) => {
    noise(t, { dur: 0.22, gain: 0.8 * vol, type: 'highpass', f0: 1800, q: 0.5, wet: 0.3 });
    noise(t + 0.03, { dur: 2.8, gain: 0.75 * vol, type: 'lowpass', f0: 900, f1: 70, q: 0.7, attack: 0.06, wet: 0.45 });
    tone(t, { f0: 70, f1: 32, dur: 1.6, gain: 0.5 * vol, attack: 0.01, wet: 0.2 });
  };
  const zap = (t, vol = 1, pan = 0) => {
    tone(t, { type: 'sawtooth', f0: 3200, f1: 140, dur: 0.28, gain: 0.12 * vol, pan, wet: 0.2 });
    tone(t + 0.02, { type: 'square', f0: 1700, f1: 90, dur: 0.22, gain: 0.06 * vol, pan, wet: 0.2 });
    noise(t, { dur: 0.2, gain: 0.25 * vol, type: 'highpass', f0: 4500, pan, wet: 0.2 });
  };
  const whoosh = (t, dur, vol = 1) => noise(t, { dur, gain: 0.45 * vol, f0: 250, f1: 3800, q: 1.4, attack: dur * 0.75, wet: 0.3 });
  const impact = (t, vol = 1) => {
    tone(t, { f0: 150, f1: 38, dur: 0.9, gain: 0.85 * vol, glide: 0.35, wet: 0.3 });
    noise(t, { dur: 0.45, gain: 0.45 * vol, type: 'lowpass', f0: 3200, f1: 180, wet: 0.35 });
    noise(t, { dur: 0.05, gain: 0.3 * vol, type: 'highpass', f0: 3000, wet: 0.1 });
  };
  const riser = (t0, t1) => {
    noise(t0, { dur: t1 - t0, gain: 0.3, f0: 400, f1: 6000, q: 2, attack: t1 - t0 - 0.03, wet: 0.3 });
    tone(t0, { type: 'sawtooth', f0: 110, f1: 880, dur: t1 - t0, gain: 0.035, attack: t1 - t0 - 0.03, wet: 0.3 });
  };
  const pop = (t, f, vol = 1, pan = 0) => {
    tone(t, { f0: f, f1: f * 0.55, dur: 0.12, gain: 0.3 * vol, glide: 0.08, pan, wet: 0.15 });
    tone(t, { type: 'triangle', f0: f * 2, dur: 0.05, gain: 0.06 * vol, pan, wet: 0.1 });
  };
  const ding = (t, f, vol = 1, pan = 0) => {
    tone(t, { f0: f, dur: 1.0, gain: 0.22 * vol, pan, wet: 0.45 });
    tone(t, { f0: f * 2.01, dur: 0.5, gain: 0.07 * vol, pan, wet: 0.45 });
    tone(t, { f0: f * 3.02, dur: 0.25, gain: 0.035 * vol, pan, wet: 0.45 });
  };
  const sparkle = (t, n = 12) => {
    for (let i = 0; i < n; i++) tone(t + i * 0.035, { f0: 3000 + r() * 4000, dur: 0.15, gain: 0.04, pan: r() * 2 - 1, wet: 0.5 });
  };
  const errBeep = t => {
    tone(t, { type: 'square', f0: 440, dur: 0.09, gain: 0.05, wet: 0.1 });
    tone(t + 0.1, { type: 'square', f0: 330, dur: 0.13, gain: 0.05, wet: 0.1 });
  };

  // ---- music bed: low pad + light pulse once the logo hits ----
  [55, 82.41, 110, 164.81].forEach((f, i) => {
    [-4, 4].forEach(cents => {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * Math.pow(2, cents / 1200);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.8;
      lp.frequency.setValueAtTime(350, 0);
      lp.frequency.linearRampToValueAtTime(500, T.logo - 0.1);
      lp.frequency.linearRampToValueAtTime(1300, T.logo + 0.2);
      lp.frequency.linearRampToValueAtTime(700, DURATION);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.linearRampToValueAtTime(0.022 / (1 + i * 0.3), 1.5);
      g.gain.setValueAtTime(0.022 / (1 + i * 0.3), DURATION - 0.6);
      g.gain.linearRampToValueAtTime(0.0001, DURATION);
      o.connect(lp); lp.connect(g); out(g, cents > 0 ? 0.3 : -0.3, 0.2);
      o.start(0); o.stop(DURATION);
    });
  });
  for (let b = T.logo + 0.5; b < DURATION - 0.6; b += 0.5) {
    tone(b, { f0: 140, f1: 45, dur: 0.32, gain: 0.32, glide: 0.12, wet: 0 });
    noise(b + 0.25, { dur: 0.04, gain: 0.05, type: 'highpass', f0: 8000, wet: 0.05 });
  }

  // ---- scene 1: lightning + typing ----
  BOLTS.forEach(({ t0 }, i) => { thunder(t0, i === 2 ? 0.55 : 1); zap(t0, i === 2 ? 0.6 : 1); });
  chars.forEach(ch => click(ch.t, (ch.x / PW - 0.5) * 0.8, 0.8 + r() * 0.4));
  lineEnds.forEach(te => errBeep(te + 0.1));
  impact(T.enter, 0.35); click(T.enter, 0, 1.5);
  SURGES.forEach(([a, b], i) => whoosh(a - 0.12, b - a + 0.3, i === 0 ? 1 : 0.7));

  // ---- scene 2: slams ----
  SLAMS.forEach(({ t0 }, i) => { whoosh(t0 - 0.18, 0.22, 0.4); impact(t0 + 0.03, 0.75 + i * 0.1); });
  riser(6.9, T.strike2);

  // ---- scene 3: logo ----
  impact(T.logo, 1.25);
  LOGO_LETTERS.forEach((_, i) => pop(T.logo + 0.2 + i * 0.05, 300 + i * 40, 0.8));
  for (let j = 0; j < 8; j++) click(T.logo + 0.52 + j * 0.035, (j / 7 - 0.5) * 0.6, 0.6);
  zap(T.logo + 0.65, 0.7, -0.6); zap(T.logo + 0.75, 0.7, 0.6);
  for (let j = 0; j < 27; j += 2) click(T.logo + 0.9 + j * 0.0185, 0, 0.35);

  // ---- scene 4: Nextdoor badge ----
  whoosh(T.badge - 0.05, 0.7, 0.8);
  impact(T.badge + 0.7, 0.55);
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => ding(T.badge + 0.7 + i * 0.07, f, 0.9, (i - 1.5) * 0.3));
  sparkle(T.badge + 1.1, 14);
  for (let i = 0; i < 26; i++) noise(T.badge + 0.75 + r() * 1.2, { dur: 0.02, gain: 0.05 + r() * 0.05, type: 'highpass', f0: 5000, pan: r() * 2 - 1, wet: 0.2 });

  // ---- scene 5: services ----
  [523.3, 587.3, 659.3, 784, 880, 1046.5].forEach((f, i) => pop(tileTime(i) + 0.04, f, 1, i % 2 ? 0.4 : -0.4));
  whoosh(T.stamp - 0.2, 0.22, 0.5); impact(T.stamp + 0.03, 1);

  // ---- scene 6: trust checklist ----
  [659.3, 784, 880, 1046.5].forEach((f, i) => { pop(checkTime(i), 300, 0.5); ding(checkTime(i) + 0.25, f, 0.8); });

  // ---- the team: van pulls in, owner scans in ----
  const vt = T.trust + 0.15, vs = T.trust + VAN_STOP;
  noise(vt, { dur: vs - vt + 0.1, gain: 0.35, f0: 300, f1: 1400, q: 1, attack: (vs - vt) * 0.6, wet: 0.2 });
  tone(vt, { type: 'sawtooth', f0: 70, f1: 45, dur: vs - vt + 0.15, gain: 0.07, attack: 0.1, wet: 0.1 });
  noise(vs - 0.22, { dur: 0.3, gain: 0.22, f0: 2600, f1: 1900, q: 8, attack: 0.05, wet: 0.2 });   // tire chirp
  impact(vs, 0.45);
  tone(T.trust + MAN_REVEAL[0], { f0: 300, f1: 1200, dur: MAN_REVEAL[1] - MAN_REVEAL[0], gain: 0.06, attack: 0.4, wet: 0.4 });
  sparkle(T.trust + MAN_REVEAL[1] - 0.05, 8);
  [0, 1, 2].forEach(i => pop(T.trust + 1.27 + i * 0.15, 700 + i * 120, 0.6));
  noise(T.trust + 1.75, { dur: 0.3, gain: 0.25, f0: 1500, f1: 4000, q: 2, attack: 0.1, wet: 0.2 });

  // ---- scene 7: CTA ----
  noise(T.cta + 0.28, { dur: 0.35, gain: 0.45, f0: 700, f1: 2600, q: 1.2, attack: 0.1, wet: 0.2 });
  for (let tt = T.cta + 0.3; tt < digitLand(11); tt += 1 / 30) tone(tt, { type: 'triangle', f0: 2200, dur: 0.018, gain: 0.025, wet: 0 });
  for (let i = 0; i < 12; i++) if (PHONE[i] !== '-') { click(digitLand(i), (i / 11 - 0.5) * 0.8, 0.9); pop(digitLand(i), 600 + i * 45, 0.5); }
  impact(digitLand(0), 0.45);
  ding(digitLand(11) + 0.15, 1568, 0.8);
  whoosh(T.cta + 0.95, 0.35, 0.4);
  [1046.5, 1318.5, 1568].forEach((f, i) => ding(T.cta + 1.75 + i * 0.07, f, 0.6));
  sparkle(T.cta + 2.2, 10);

  return ac.startRendering();
}

function audioBufferToWav(buf) {
  const chs = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const data = [];
  let peak = 0;
  for (let c = 0; c < chs; c++) { const d = buf.getChannelData(c); data.push(d); for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i])); }
  const norm = peak > 0 ? 0.89 / peak : 1;            // normalize to about -1 dBFS
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
