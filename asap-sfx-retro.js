// 8-bit arcade palette for asap-audio.js, loaded with ?sfx=retro.
// Original chip-style sounds in the spirit of early-'80s arcade cabinets; no game audio is sampled or copied.
window.RETRO_SFX = ({ ac, sr, r, out, envelope, tone }) => {
  // low-res noise that holds each value for a few samples, like an arcade noise channel
  const crunch = ac.createBuffer(1, sr * 2, sr);
  const cd = crunch.getChannelData(0);
  for (let i = 0, v = 0; i < cd.length; i++) { if (i % 24 === 0) v = r() < 0.5 ? -1 : 1; cd[i] = v; }
  const crunchNoise = (t, { dur, gain, f0 = 4000, f1 = f0, pan = 0, wet = 0.1 }) => {
    const s = ac.createBufferSource(); s.buffer = crunch; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = 'lowpass';
    fl.frequency.setValueAtTime(f0, t); if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); envelope(g, t, gain, 0.002, dur);
    s.connect(fl); fl.connect(g); out(g, pan, wet); s.start(t, r()); s.stop(t + dur + 0.05);
  };
  // one chip note per step; 0 is a rest
  const seq = (t, notes, step, { type = 'square', gain = 0.08, pan = 0, wet = 0.08, hold = 0.9 } = {}) =>
    notes.forEach((f, i) => f && tone(t + i * step, { type, f0: f, dur: step * hold, gain, attack: 0.001, pan, wet }));
  // flat-volume pitch slide with optional vibrato, for chomps, dives and sirens
  const slide = (t, { f0, f1, dur, gain, type = 'triangle', vib = 0, rate = 12, pan = 0, wet = 0.1 }) => {
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = rate; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t); g.gain.setValueAtTime(gain, t + dur * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); out(g, pan, wet); o.start(t); o.stop(t + dur + 0.05);
  };
  let chomp = 0;
  return {
    click: (t, pan = 0, vol = 1) => {          // wakka-style chomp, alternating direction each keystroke
      const up = chomp++ % 2;
      slide(t, { f0: up ? 220 : 480, f1: up ? 480 : 220, dur: 0.055, gain: 0.11 * vol, pan, wet: 0.02 });
    },
    thunder: (t, vol = 1) => {                 // big crunchy explosion
      crunchNoise(t, { dur: 1.4, gain: 0.7 * vol, f0: 5000, f1: 150, wet: 0.25 });
      tone(t, { type: 'square', f0: 110, f1: 30, dur: 0.6, gain: 0.18 * vol, wet: 0.1 });
    },
    zap: (t, vol = 1, pan = 0) => {            // laser shot
      tone(t, { type: 'square', f0: 1900, f1: 160, dur: 0.18, gain: 0.1 * vol, pan, wet: 0.1, glide: 0.16 });
      tone(t + 0.04, { type: 'square', f0: 1400, f1: 120, dur: 0.16, gain: 0.06 * vol, pan, wet: 0.1, glide: 0.14 });
    },
    whoosh: (t, dur, vol = 1) => slide(t, { f0: 1500, f1: 260, dur, gain: 0.07 * vol, vib: 70, rate: 14, wet: 0.15 }),  // diving siren
    impact: (t, vol = 1) => {                  // chunky stepped boom
      seq(t, [140, 104, 78, 58], 0.035, { gain: 0.16 * vol, hold: 1 });
      crunchNoise(t, { dur: 0.35, gain: 0.45 * vol, f0: 2500, f1: 200, wet: 0.15 });
    },
    riser: (t0, t1) => {                       // climbing arpeggio
      const steps = Math.floor((t1 - t0) / 0.05), chord = [262, 330, 392, 523];
      seq(t0, Array.from({ length: steps }, (_, i) => chord[i % 4] * Math.pow(2, Math.floor(i / 4) / 3)), 0.05, { gain: 0.05 });
    },
    pop: (t, f, vol = 1, pan = 0) => seq(t, [f * 2, f * 3], 0.045, { gain: 0.07 * vol, pan }),   // two-note pickup
    ding: (t, f, vol = 1, pan = 0) => seq(t, [f / 2, f * 0.63, f * 0.75, f], 0.04, { gain: 0.07 * vol, pan, wet: 0.15 }),  // power-up
    sparkle: (t, n = 12) => {
      for (let i = 0; i < n; i++) tone(t + i * 0.035, { type: 'square', f0: 2000 + r() * 3000, dur: 0.03, gain: 0.03, pan: r() * 2 - 1, wet: 0.2 });
    },
    errBeep: t => seq(t, [494, 466, 440, 415, 392, 370], 0.05, { gain: 0.06 }),   // falling "miss" bloops
    fanfare: (t, vol = 1) => {                 // short original level-clear jingle with a triangle bass
      const C5 = 523.3, E5 = 659.3, G5 = 784, A5 = 880, C6 = 1046.5;
      seq(t, [C5, E5, G5, C6, 0, G5, A5, C6], 0.075, { gain: 0.08 * vol, wet: 0.15 });
      seq(t, [C5 / 2, 0, G5 / 4, 0, C5 / 2, 0, G5 / 4, C5 / 2], 0.075, { type: 'triangle', gain: 0.2 * vol, wet: 0.05 });
    },
  };
};
