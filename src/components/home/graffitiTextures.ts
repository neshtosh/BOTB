import * as THREE from 'three';

// Paints the subway-tunnel surfaces on canvases (no image files): concrete,
// roll-up shutters, wildstyle pieces with drips, bubble throw-ups, tags,
// a sprayed Unsigned logo, brick ceiling and a chalk-covered floor.

const INK = '#0b0b0c';
const SIGNAL = '#f2e600';

function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Drawing coordinates stay in the full-size layout; `scale` only sets how many
// pixels the canvas gets, so a smaller texture looks the same, just softer.
function canvas(w: number, h: number, scale: number) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  return [c, ctx] as const;
}

function toTexture(c: HTMLCanvasElement, repeatX = 1) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeatX !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, 1);
  }
  return tex;
}

// Grimy concrete: base colour, speckle, water stains.
function grime(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, rand: () => number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 3, 1 + rand() * 3);
  }
  for (let i = 0; i < w / 180; i++) {
    const x = rand() * w;
    const g = ctx.createLinearGradient(x, 0, x, h);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, 20 + rand() * 60, h * (0.3 + rand() * 0.5));
  }
}

function spray(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drips(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string, rand: () => number, count = 6) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const dx = x + rand() * width;
    const len = 12 + rand() * 60;
    ctx.lineWidth = 2 + rand() * 4;
    ctx.beginPath();
    ctx.moveTo(dx, y);
    ctx.lineTo(dx, y + len);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dx, y + len, ctx.lineWidth * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Wildstyle-ish piece: shadow, fat black outline, white highlight, gradient fill, drips.
function piece(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  colors: [string, string, string],
  rand: () => number,
  rotate = -0.05
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.font = `${size}px Dracutaz, "Inter Tight", sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const w = ctx.measureText(text).width;

  spray(ctx, w / 2, -size * 0.35, w * 0.65, colors[2], 0.35);
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillText(text, size * 0.07, size * 0.07);
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.05;
  ctx.strokeText(text, 0, 0);
  const g = ctx.createLinearGradient(0, -size * 0.8, 0, size * 0.1);
  g.addColorStop(0, colors[0]);
  g.addColorStop(0.55, colors[1]);
  g.addColorStop(1, colors[0]);
  ctx.fillStyle = g;
  ctx.fillText(text, 0, 0);
  // Highlight streaks.
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) ctx.fillRect(rand() * w, -size * (0.2 + rand() * 0.5), size * 0.05, size * 0.12);
  ctx.globalAlpha = 1;
  drips(ctx, 0, size * 0.06, w, colors[1], rand, Math.round(w / 70));
  ctx.restore();
  return w;
}

// Round bubble letters (throw-up).
function throwie(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, rand: () => number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.03 + rand() * 0.06);
  ctx.font = `900 italic ${size}px "Inter Tight", sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = size * 0.22;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = size * 0.035;
  ctx.strokeText(text, -size * 0.02, -size * 0.02);
  ctx.restore();
}

// Drawing brush-font text at a new size or angle makes the browser trace every
// glyph outline from scratch, several ms a letter: the tunnel's ~80 tags took
// seconds. So each tag word is drawn once, upright at a fixed size, and then
// stamped as an image at whatever size and angle the tag needs.
interface Sprite {
  canvas: HTMLCanvasElement;
  fontSize: number;
  left: number;
  ascent: number;
  width: number;
}
const sprites = new Map<string, Sprite>();

// Call once every surface is painted; the sprites are only needed while drawing.
export function clearWordSprites() {
  sprites.clear();
}

function wordSprite(text: string, color: string, size: number): Sprite {
  const fontSize = size > 72 ? 112 : 72;
  const key = `${text}|${color}|${fontSize}`;
  const cached = sprites.get(key);
  if (cached) return cached;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d')!;
  ctx.font = `${fontSize}px Dracutaz, sans-serif`;
  const m = ctx.measureText(text);
  const pad = 4;
  const left = Math.ceil(m.actualBoundingBoxLeft) + pad;
  const ascent = Math.ceil(m.actualBoundingBoxAscent) + pad;
  c.width = left + Math.ceil(m.actualBoundingBoxRight) + pad;
  c.height = ascent + Math.ceil(m.actualBoundingBoxDescent) + pad;
  ctx.font = `${fontSize}px Dracutaz, sans-serif`; // resizing the canvas resets it
  ctx.fillStyle = color;
  ctx.fillText(text, left, ascent);
  const sprite = { canvas: c, fontSize, left, ascent, width: m.width };
  sprites.set(key, sprite);
  return sprite;
}

function tag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, rand: () => number) {
  const sprite = wordSprite(text, color, size);
  const k = size / sprite.fontSize;
  const width = sprite.width * k;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15 + rand() * 0.3);
  ctx.drawImage(sprite.canvas, -sprite.left * k, -sprite.ascent * k, sprite.canvas.width * k, sprite.canvas.height * k);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.25);
  ctx.quadraticCurveTo(width * 0.6, size * 0.45, width * 1.1, size * 0.1);
  ctx.stroke();
  ctx.restore();
}

// The Unsigned mark, sprayed: yellow tile, U-arrow stroke, overspray, drips.
function logoMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rand: () => number) {
  const s = size / 64;
  spray(ctx, x + size / 2, y + size / 2, size * 0.95, SIGNAL, 0.45);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.06);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(size * 0.04, size * 0.05, size, size, 14 * s);
  ctx.fill();
  ctx.fillStyle = SIGNAL;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 14 * s);
  ctx.fill();
  drips(ctx, size * 0.1, size * 0.96, size * 0.8, SIGNAL, rand, 5);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 8.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D('M14 16 V34 a13 13 0 0 0 26 0 V30 L50 16'));
  ctx.stroke(new Path2D('M38.5 15.5 H50.5 V27.5'));
  ctx.restore();
}

function doodle(ctx: CanvasRenderingContext2D, kind: 'heart' | 'crown' | 'smile' | 'star', x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'heart') {
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 0.6, -s * 0.1, -s * 0.3, -s * 0.6, 0, -s * 0.2);
    ctx.bezierCurveTo(s * 0.3, -s * 0.6, s * 0.6, -s * 0.1, 0, s * 0.35);
  } else if (kind === 'crown') {
    ctx.moveTo(-s / 2, s / 3);
    ctx.lineTo(-s / 2, -s / 4);
    ctx.lineTo(-s / 4, s / 8);
    ctx.lineTo(0, -s / 2.5);
    ctx.lineTo(s / 4, s / 8);
    ctx.lineTo(s / 2, -s / 4);
    ctx.lineTo(s / 2, s / 3);
    ctx.closePath();
  } else if (kind === 'smile') {
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.moveTo(-s / 6, -s / 8);
    ctx.arc(-s / 6, -s / 8, 2, 0, Math.PI * 2);
    ctx.moveTo(s / 6 + 2, -s / 8);
    ctx.arc(s / 6, -s / 8, 2, 0, Math.PI * 2);
    ctx.moveTo(-s / 4, s / 10);
    ctx.quadraticCurveTo(0, s / 3, s / 4, s / 10);
  } else {
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * s / 2, Math.sin(a) * s / 2);
    }
    ctx.closePath();
  }
  ctx.stroke();
  ctx.restore();
}

// Roll-up shutters: panels with horizontal slats, some painted.
function shutters(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let sy = y + 10; sy < y + h; sy += 12) {
    ctx.beginPath();
    ctx.moveTo(x, sy);
    ctx.lineTo(x + w, sy);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 6;
  ctx.strokeRect(x, y, w, h);
}

const PALETTES: [string, string, string][] = [
  ['#3ee6c8', '#1fb5a0', '#ff4d2e'],
  ['#ff4d2e', '#ff9a3d', '#f2e600'],
  ['#ff7ab6', '#c13fd1', '#3ee6c8'],
  ['#f2e600', '#ffb800', '#ff4d2e'],
];

const TAGS = ['indie', 'RISE', 'no label', 'SELF MADE', 'own it', 'drop', 'KASI', 'unsigned', 'loud', 'free'];

export function makeWallTexture(seed: number, featured: boolean, scale = 1) {
  const W = 4096;
  const H = 640;
  const [c, ctx] = canvas(W, H, scale);
  const rand = rng(seed);
  grime(ctx, W, H, '#2a292f', rand);

  // Shutter panels along the wall, painted in grubby colours.
  const panelColors = ['#3a3940', '#47413a', '#4d2c2f', '#2d3f4d', '#3d452d'];
  for (let x = 40; x < W; ) {
    const w = 380 + rand() * 340;
    shutters(ctx, x, 150, w, 440, panelColors[Math.floor(rand() * panelColors.length)]);
    x += w + 24 + rand() * 40;
  }
  // Signage strip above the shutters.
  ctx.fillStyle = '#0d0d10';
  ctx.fillRect(0, 70, W, 60);

  // Tags everywhere.
  for (let i = 0; i < 60; i++) {
    tag(ctx, TAGS[Math.floor(rand() * TAGS.length)], rand() * W, 110 + rand() * 500, 30 + rand() * 40, rand() > 0.5 ? '#ffffff' : ['#ff7ab6', '#3ee6c8', SIGNAL, '#ff4d2e'][Math.floor(rand() * 4)], rand);
  }

  if (featured) {
    // The main piece: UNSIGNED, big, near the viewer.
    piece(ctx, 'UNSIGNED', 1250, 480, 250, ['#3ee6c8', '#22a8ff', '#ff4d2e'], rand, -0.06);
    // Sprayed logo + throw-up, a little further down the wall.
    logoMark(ctx, 960, 210, 210, rand);
    throwie(ctx, 'unsigned.', 2480, 440, 130, SIGNAL, rand);
  }

  // More pieces further down the tunnel.
  const words = featured ? ['RISE'] : ['INDIE', 'OWN IT', 'DROP', 'FREE'];
  let x = featured ? 3150 : 200;
  for (const word of words) {
    const w = piece(ctx, word, x, 470 + rand() * 40, 150 + rand() * 60, PALETTES[Math.floor(rand() * PALETTES.length)], rand, -0.08 + rand() * 0.16);
    x += w + 160 + rand() * 200;
  }
  if (!featured) logoMark(ctx, x, 260, 180, rand);

  for (let i = 0; i < 18; i++) {
    doodle(ctx, (['heart', 'crown', 'smile', 'star'] as const)[i % 4], rand() * W, 180 + rand() * 380, 40 + rand() * 40, rand() > 0.5 ? '#ffffff' : SIGNAL);
  }

  // Grime pass and a light falloff toward the floor.
  const fade = ctx.createLinearGradient(0, 0, 0, H);
  fade.addColorStop(0, 'rgba(0,0,0,0.45)');
  fade.addColorStop(0.25, 'rgba(0,0,0,0)');
  fade.addColorStop(0.85, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, W, H);
  return toTexture(c);
}

export function makeBrickTexture(seed: number, scale = 1) {
  const W = 1024;
  const H = 512;
  const [c, ctx] = canvas(W, H, scale);
  const rand = rng(seed);
  ctx.fillStyle = '#121114';
  ctx.fillRect(0, 0, W, H);
  const bw = 64;
  const bh = 24;
  for (let row = 0; row * bh < H; row++) {
    for (let col = -1; col * bw < W; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0);
      const shade = 26 + rand() * 22;
      ctx.fillStyle = `rgb(${shade + 8},${shade},${shade - 2})`;
      ctx.fillRect(x + 2, row * bh + 2, bw - 4, bh - 4);
    }
  }
  // Soot and old tags on the ceiling.
  for (let i = 0; i < 12; i++) spray(ctx, rand() * W, rand() * H, 60 + rand() * 120, '#000000', 0.5);
  for (let i = 0; i < 8; i++) tag(ctx, TAGS[Math.floor(rand() * TAGS.length)], rand() * W, rand() * H, 36 + rand() * 30, 'rgba(255,255,255,0.75)', rand);
  return toTexture(c, 6);
}

export function makeFloorTexture(seed: number, scale = 1) {
  const W = 2048;
  const H = 1024;
  const [c, ctx] = canvas(W, H, scale);
  const rand = rng(seed);
  grime(ctx, W, H, '#232226', rand);
  // Chalk scribbles and words.
  const chalk = ['#ffffff', '#ff7ab6', '#3ee6c8', SIGNAL, '#a5ff6b', '#ff9a3d'];
  ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = chalk[Math.floor(rand() * chalk.length)];
    ctx.globalAlpha = 0.35 + rand() * 0.4;
    ctx.lineWidth = 3 + rand() * 5;
    ctx.beginPath();
    let px = rand() * W;
    let py = rand() * H;
    ctx.moveTo(px, py);
    for (let k = 0; k < 4; k++) {
      const nx = px + (rand() - 0.5) * 300;
      const ny = py + (rand() - 0.5) * 200;
      ctx.quadraticCurveTo(px + (rand() - 0.5) * 200, py + (rand() - 0.5) * 200, nx, ny);
      px = nx;
      py = ny;
    }
    ctx.stroke();
  }
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.5 + rand() * 0.3;
    tag(ctx, TAGS[Math.floor(rand() * TAGS.length)], rand() * W, rand() * H, 60 + rand() * 50, chalk[Math.floor(rand() * chalk.length)], rand);
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

// Fonts must be ready before painting text onto canvases.
export async function loadGraffitiFonts() {
  await Promise.all([
    document.fonts.load('64px Dracutaz'),
    document.fonts.load('900 italic 64px "Inter Tight"'),
  ]).catch(() => undefined);
}
