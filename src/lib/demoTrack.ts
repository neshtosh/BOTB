// A short original demo track, synthesised in the browser (no audio files).
// It has a real song shape — quiet intro, verses, a loud repeating chorus,
// outro — so the hook finder has something genuine to find.
// Samples are computed directly, which is far faster than building
// thousands of Web Audio nodes.

export const DEMO_BPM = 120;
const BEAT = 60 / DEMO_BPM;
const BAR = BEAT * 4;
const SAMPLE_RATE = 22050;

type Section = 'intro' | 'verse' | 'chorus' | 'outro';
// 34 bars = 68 s at 120 BPM.
const ARRANGEMENT: [Section, number][] = [
  ['intro', 4],
  ['verse', 8],
  ['chorus', 8],
  ['verse', 4],
  ['chorus', 8],
  ['outro', 2],
];

// A minor: Am – F – C – G, one chord per bar.
const ROOTS = [110, 87.31, 130.81, 98];
const CHORDS = [
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [261.63, 329.63, 392],
  [196, 246.94, 293.66],
];
// Chorus lead, 8 eighth-notes per bar (0 = rest), alternating every bar.
const LEAD = [
  [659.25, 0, 587.33, 659.25, 0, 523.25, 587.33, 0],
  [523.25, 0, 440, 523.25, 587.33, 0, 659.25, 783.99],
];

export const DEMO_SECTIONS = (() => {
  let t = 0;
  return ARRANGEMENT.map(([name, bars]) => {
    const start = t;
    t += bars * BAR;
    return { name, start, end: t };
  });
})();

export const DEMO_DURATION = DEMO_SECTIONS[DEMO_SECTIONS.length - 1].end;

// Deterministic noise so the track is identical on every load.
function makeNoise(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
}

export function synthesizeDemo(): Float32Array {
  const sr = SAMPLE_RATE;
  const out = new Float32Array(Math.ceil(DEMO_DURATION * sr));
  const noise = makeNoise(7);

  const kick = (t: number, level: number) => {
    const start = Math.floor(t * sr);
    const n = Math.floor(0.32 * sr);
    let phase = 0;
    for (let i = 0; i < n && start + i < out.length; i++) {
      const x = i / sr;
      const f = 45 + 105 * Math.exp(-x / 0.03);
      phase += (2 * Math.PI * f) / sr;
      out[start + i] += Math.sin(phase) * level * Math.exp(-x / 0.08);
    }
  };

  // Noise burst; `bright` 0..1 mixes in a differenced (high-passed) version.
  const hit = (t: number, level: number, length: number, bright: number) => {
    const start = Math.floor(t * sr);
    const n = Math.floor(length * sr);
    let prev = 0;
    for (let i = 0; i < n && start + i < out.length; i++) {
      const v = noise();
      const hp = v - prev;
      prev = v;
      out[start + i] += (v * (1 - bright) + hp * bright * 0.6) * level * Math.exp(-(i / sr) / (length / 4));
    }
  };

  const tone = (t: number, freq: number, length: number, level: number, wave: 'saw' | 'square', cutoff: number) => {
    const start = Math.floor(t * sr);
    const n = Math.floor(length * sr);
    const alpha = 1 - Math.exp((-2 * Math.PI * cutoff) / sr);
    let phase = 0;
    let lp = 0;
    for (let i = 0; i < n && start + i < out.length; i++) {
      phase = (phase + freq / sr) % 1;
      const raw = wave === 'saw' ? 2 * phase - 1 : phase < 0.5 ? 1 : -1;
      lp += alpha * (raw - lp);
      const x = i / sr;
      const env = Math.min(1, x / 0.01) * Math.exp(-x / (length / 2.5));
      out[start + i] += lp * level * env;
    }
  };

  let barIndex = 0;
  for (const { name, start, end } of DEMO_SECTIONS) {
    for (let bar = start; bar < end - 1e-6; bar += BAR, barIndex++) {
      const chord = barIndex % 4;
      const loud = name === 'chorus';
      const quiet = name === 'intro' || name === 'outro';

      for (const f of CHORDS[chord]) tone(bar, f, BAR, quiet ? 0.05 : loud ? 0.07 : 0.04, 'saw', quiet ? 900 : 1600);

      for (let step = 0; step < 8; step++) {
        const t = bar + step * (BEAT / 2);
        hit(t, quiet ? 0.05 : loud ? 0.14 : 0.09, loud && step % 2 ? 0.12 : 0.04, 0.9);
        if (quiet) continue;
        if (step % 2 === 0) kick(t, loud ? 0.95 : 0.7);
        if (step === 2 || step === 6) hit(t, loud ? 0.45 : 0.3, 0.18, 0.4);
        tone(t, ROOTS[chord] * (step % 2 ? 2 : 1), BEAT / 2.2, loud ? 0.3 : 0.22, 'saw', loud ? 900 : 600);
        if (loud) {
          const note = LEAD[barIndex % 2][step];
          if (note) tone(t, note, BEAT / 2.1, 0.14, 'square', 3200);
        }
      }
    }
  }

  // Soft-clip and normalise.
  let peak = 0;
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.tanh(out[i] * 1.2);
    peak = Math.max(peak, Math.abs(out[i]));
  }
  const gain = 0.9 / (peak || 1);
  for (let i = 0; i < out.length; i++) out[i] *= gain;
  return out;
}

export function renderDemoTrack(): AudioBuffer {
  const samples = synthesizeDemo();
  const buffer = new AudioBuffer({ length: samples.length, numberOfChannels: 1, sampleRate: SAMPLE_RATE });
  buffer.getChannelData(0).set(samples);
  return buffer;
}
