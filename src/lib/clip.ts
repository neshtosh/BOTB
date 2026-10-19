import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { MediaType } from '../types/platform';

// ---------------------------------------------------------------------------
// Hook detection
// ---------------------------------------------------------------------------

export const HOP_SECONDS = 0.25;

export interface AudioAnalysis {
  duration: number;
  // Loudness per HOP_SECONDS frame, normalised to 0..1. Drives the waveform and scoring.
  energy: number[];
  // Zero-crossing rate per frame: a cheap stand-in for brightness/timbre.
  brightness: number[];
}

export async function analyzeAudio(file: Blob): Promise<AudioAnalysis> {
  const ctx = new AudioContext();
  try {
    return analyzeBuffer(await ctx.decodeAudioData(await file.arrayBuffer()));
  } finally {
    ctx.close();
  }
}

// Same analysis for audio that is already decoded (or generated).
export function analyzeBuffer(buffer: AudioBuffer): AudioAnalysis {
  const hop = Math.floor(buffer.sampleRate * HOP_SECONDS);
  const frames = Math.floor(buffer.length / hop);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const energy: number[] = new Array(frames);
  const brightness: number[] = new Array(frames);

  for (let f = 0; f < frames; f++) {
    let sum = 0;
    let crossings = 0;
    let prev = 0;
    // Every 4th sample is plenty for an envelope and keeps long tracks fast.
    for (let i = f * hop; i < (f + 1) * hop; i += 4) {
      let s = 0;
      for (const ch of channels) s += ch[i];
      s /= channels.length;
      sum += s * s;
      if ((s >= 0) !== (prev >= 0)) crossings++;
      prev = s;
    }
    energy[f] = Math.sqrt(sum / (hop / 4));
    brightness[f] = crossings / (hop / 4);
  }

  return { duration: buffer.duration, energy: normalise(energy), brightness: normalise(brightness) };
}

function normalise(values: number[]) {
  const max = Math.max(...values, 1e-9);
  return values.map((v) => v / max);
}

function correlation(a: number[], b: number[]) {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export interface HookSuggestion {
  start: number;
  score: number;
}

// Ranks clip start points: hooks/choruses tend to be loud *and* to repeat
// elsewhere in the track, while intros sit at the very start.
export function findHooks(analysis: AudioAnalysis, clipSeconds: number, count = 3): HookSuggestion[] {
  const { energy, brightness, duration } = analysis;
  const win = Math.round(clipSeconds / HOP_SECONDS);
  const step = Math.round(1 / HOP_SECONDS); // evaluate one start per second
  const lastStart = energy.length - win;
  if (lastStart <= 0) return [{ start: 0, score: 1 }];

  const feature = (s: number) => [...energy.slice(s, s + win), ...brightness.slice(s, s + win)];
  const starts: number[] = [];
  for (let s = 0; s <= lastStart; s += step) starts.push(s);

  const loudness = starts.map((s) => energy.slice(s, s + win).reduce((a, b) => a + b, 0) / win);
  const repetition = starts.map((s) => {
    const fs = feature(s);
    let best = 0;
    for (const t of starts) {
      if (Math.abs(t - s) < win) continue;
      best = Math.max(best, correlation(fs, feature(t)));
    }
    return best;
  });

  const range = (xs: number[]) => {
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    return xs.map((x) => (max - min ? (x - min) / (max - min) : 0.5));
  };
  const L = range(loudness);
  const R = range(repetition);

  const scored = starts.map((s, i) => {
    const seconds = s * HOP_SECONDS;
    const introPenalty = seconds < duration * 0.08 ? 0.3 : 0;
    return { start: seconds, score: 0.55 * L[i] + 0.45 * R[i] - introPenalty };
  });
  scored.sort((a, b) => b.score - a.score);

  // Keep suggestions far enough apart to be genuinely different choices.
  const picks: HookSuggestion[] = [];
  for (const candidate of scored) {
    if (picks.every((p) => Math.abs(p.start - candidate.start) >= clipSeconds / 2)) picks.push(candidate);
    if (picks.length === count) break;
  }
  return picks;
}

// ---------------------------------------------------------------------------
// Cover art fallback
// ---------------------------------------------------------------------------

// Generates a simple branded 9:16 still for audio clips when no cover is chosen.
export async function makeCoverImage(title: string, subtitle: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 720, 1280);
  gradient.addColorStop(0, '#1749e3');
  gradient.addColorStop(1, '#0d0d10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 720, 1280);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px system-ui, sans-serif';
  wrapText(ctx, title, 360, 600, 620, 76);
  ctx.font = '36px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(subtitle, 360, 860);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create cover image'))), 'image/png')
  );
}

// Center-crops any image to a 720x1280 JPEG (the clip's frame size).
async function fitCover(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  const scale = Math.max(720 / bitmap.width, 1280 / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (720 - w) / 2, (1280 - h) / 2, w, h);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare cover image'))), 'image/jpeg', 0.9)
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const top = y - ((lines.length - 1) * lineHeight) / 2;
  lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, x, top + i * lineHeight));
}

// ---------------------------------------------------------------------------
// Rendering (ffmpeg.wasm, runs entirely in the browser)
// ---------------------------------------------------------------------------

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
let ffmpegPromise: Promise<FFmpeg> | null = null;

function getFFmpeg() {
  ffmpegPromise ??= (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return ffmpeg;
  })().catch((err) => {
    ffmpegPromise = null;
    throw err;
  });
  return ffmpegPromise;
}

export interface RenderClipOptions {
  source: Blob;
  sourceName: string;
  mediaType: MediaType;
  start: number;
  duration: number;
  // Still image shown under the audio (audio sources only).
  cover?: Blob;
  onProgress?: (fraction: number) => void;
}

// Produces a vertical MP4 for TikTok / Reels / Shorts / Facebook.
export async function renderClip({ source, sourceName, mediaType, start, duration, cover, onProgress }: RenderClipOptions) {
  const ffmpeg = await getFFmpeg();
  const ext = sourceName.split('.').pop()?.toLowerCase() || (mediaType === 'audio' ? 'mp3' : 'mp4');
  const input = `input.${ext}`;
  const output = 'clip.mp4';
  // ffmpeg's own `progress` is relative to the whole source, not the clip; `time` is
  // output time in microseconds, so derive the fraction of the clip done from that.
  const handleProgress = ({ time }: { time: number }) =>
    onProgress?.(Math.min(1, Math.max(0, time / 1_000_000 / duration)));
  ffmpeg.on('progress', handleProgress);

  try {
    await ffmpeg.writeFile(input, await fetchFile(source));
    const fadeOut = Math.max(0, duration - 1);

    if (mediaType === 'audio') {
      if (!cover) throw new Error('A cover image is needed to turn audio into a video clip.');
      // Pre-sizing the still means ffmpeg doesn't decode and rescale it every frame,
      // which is what makes wasm rendering slow.
      await ffmpeg.writeFile('cover.img', await fetchFile(await fitCover(cover)));
      await ffmpeg.exec([
        '-loop', '1', '-framerate', '24', '-i', 'cover.img',
        '-ss', String(start), '-t', String(duration), '-i', input,
        '-af', `afade=t=in:d=0.5,afade=t=out:st=${fadeOut}:d=1`,
        '-pix_fmt', 'yuv420p',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'stillimage',
        '-c:a', 'aac', '-b:a', '192k',
        '-shortest', '-movflags', '+faststart',
        output,
      ]);
    } else {
      // Stream copy is near-instant; cuts snap to the nearest keyframe (usually < 2 s off).
      await ffmpeg.exec([
        '-ss', String(start), '-i', input, '-t', String(duration),
        '-c', 'copy', '-avoid_negative_ts', 'make_zero', '-movflags', '+faststart',
        output,
      ]);
    }

    const data = await ffmpeg.readFile(output);
    if (typeof data === 'string' || data.length === 0) throw new Error('Clip rendering produced no output.');
    const base = sourceName.replace(/\.[^.]+$/, '');
    return new File([new Uint8Array(data)], `${base}-clip.mp4`, { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', handleProgress);
    await Promise.all(
      [input, output, 'cover.img'].map((f) => ffmpeg.deleteFile(f).catch(() => undefined))
    );
  }
}
