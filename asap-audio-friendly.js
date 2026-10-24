// Calm soundtrack for asap-electric-friendly.html: a warm electric-piano bed with soft marimba
// and bell cues. Everything sits in the mid range (roughly 100 Hz to 1.5 kHz), with no sudden
// booms or piercing highs, so it is comfortable for older ears.
async function renderSoundtrack(sr = 48000) {
  const ac = new OfflineAudioContext(2, Math.ceil(sr * DURATION), sr);
  const r = rng(4321);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
  const master = ac.createGain(); master.gain.value = 0.9;
  const warm = ac.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 6000; warm.Q.value = 0.5;   // no hiss or piercing highs
  master.connect(warm); warm.connect(comp); comp.connect(ac.destination);

  const verb = ac.createConvolver();
  const ir = ac.createBuffer(2, sr * 2.6, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < d.length; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / d.length, 3.5);
  }
  verb.buffer = ir;
  const lowpass = ac.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 3500;
  const verbGain = ac.createGain(); verbGain.gain.value = 0.3;
  verb.connect(lowpass); lowpass.connect(verbGain); verbGain.connect(master);

  const noiseBuf = ac.createBuffer(1, sr * 2, sr);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1;

  function out(node, pan = 0, wet = 0.2) {
    const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
    node.connect(p); p.connect(master);
    if (wet > 0) { const s = ac.createGain(); s.gain.value = wet; p.connect(s); s.connect(verb); }
  }
  function tone(t, { type = 'sine', f, dur, gain, attack = 0.008, pan = 0, wet = 0.2 }) {
    if (t < 0 || t > DURATION) return;
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, pan, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  function swell(t, dur, gain) {               // soft airy transition, lowpassed so it never hisses
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 0.7;
    fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(1200, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); out(g, 0, 0.3); s.start(t, r()); s.stop(t + dur + 0.05);
  }

  // ---- instruments ----
  const epiano = (t, f, vol = 1, pan = 0) => {
    tone(t, { f, dur: 2.8, gain: 0.045 * vol, pan, wet: 0.25 });
    tone(t, { f: f * 2, dur: 1.2, gain: 0.011 * vol, pan, wet: 0.25 });
    tone(t, { f: f * 3, dur: 0.5, gain: 0.004 * vol, pan, wet: 0.25 });
  };
  const marimba = (t, f, vol = 1, pan = 0) => {
    tone(t, { f, dur: 0.6, gain: 0.16 * vol, attack: 0.006, pan, wet: 0.2 });
    tone(t, { f: f * 4, dur: 0.08, gain: 0.012 * vol, attack: 0.005, pan, wet: 0.1 });
  };
  const bell = (t, f, vol = 1, pan = 0) => {
    tone(t, { f, dur: 1.8, gain: 0.12 * vol, attack: 0.004, pan, wet: 0.4 });
    tone(t, { f: f * 2.76, dur: 0.6, gain: 0.02 * vol, attack: 0.004, pan, wet: 0.4 });
  };

  // ---- music: C – G – Am – F at 76 bpm ----
  const beat = 60 / 76, bar = beat * 4;
  const CHORDS = [
    { notes: [261.6, 329.6, 392.0], bass: 65.41 },
    { notes: [246.9, 293.7, 392.0], bass: 98.0 },
    { notes: [261.6, 329.6, 440.0], bass: 110.0 },
    { notes: [261.6, 349.2, 440.0], bass: 87.31 },
  ];
  const fadeOut = DURATION - 2.5;
  for (let b = 0, t0 = 0.2; t0 < DURATION - 0.5; b++, t0 += bar) {
    const ch = CHORDS[b % 4];
    const vol = t0 < 1 ? 0.6 : t0 > fadeOut ? 0.5 : 1;
    [0, 2].forEach(k => {
      ch.notes.forEach((f, i) => epiano(t0 + k * beat + i * 0.012, f, (k ? 0.7 : 1) * vol, (i - 1) * 0.25));
      tone(t0 + k * beat, { type: 'triangle', f: ch.bass, dur: beat * 1.8, gain: 0.16 * vol, wet: 0.05 });
    });
    if (b >= 1) {                                   // gentle arpeggio on top from the second bar
      [0, 1, 2, 1].forEach((n, k) => marimba(t0 + k * beat + beat / 2, ch.notes[n] * 2, 0.22 * vol, (k - 1.5) * 0.2));
    }
  }

  // ---- cues ----
  swell(T.intro + 0.1, 1.4, 0.04);
  bell(T.intro + 0.9, 523.3, 0.8, -0.2); bell(T.intro + 1.2, 784, 0.6, 0.2);
  [T.problems, T.meet, T.services, T.badge, T.trust, T.cta].forEach(s => swell(s - 0.3, 0.9, 0.03));
  PROBLEMS.forEach((_, i) => marimba(problemTime(i) + 0.05, [523.3, 587.3, 659.3][i], 0.9));
  bell(T.problems + 5.9, 659.3, 0.7);
  // van settles, owner appears
  tone(T.meet + 1.75, { f: 90, dur: 0.5, gain: 0.12, attack: 0.02, wet: 0.1 });
  bell(T.meet + 1.0, 523.3, 0.7, -0.2); bell(T.meet + 1.3, 659.3, 0.6, 0.2);
  SERVICES.forEach((_, i) => marimba(tileTime(i) + 0.05, [523.3, 587.3, 659.3, 784, 880, 1046.5][i], 0.7, i % 2 ? 0.3 : -0.3));
  bell(T.services + 3.2, 784, 0.7); bell(T.services + 3.4, 1046.5, 0.5);
  [523.3, 659.3, 784].forEach((f, i) => bell(T.badge + 0.9 + i * 0.16, f, 0.8, (i - 1) * 0.3));
  TRUST.forEach((_, i) => marimba(checkTime(i) + 0.2, [392, 493.9, 587.3, 784][i], 0.9));
  [523.3, 659.3, 784].forEach(f => bell(T.cta + 1.3, f, 0.6));
  marimba(T.cta + 2.45, 659.3, 0.6);
  [392, 523.3, 659.3].forEach((f, i) => bell(T.cta + 3.8 + i * 0.16, f, 0.6, (i - 1) * 0.3));

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
