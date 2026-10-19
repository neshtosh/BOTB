// Cover art helpers: checking uploaded artwork, generating a poster-style
// cover when there isn't one, and framing square art for vertical clips.

export const COVER_MIN = 1000;
export const COVER_IDEAL = 3000;
export const COVER_MAX_BYTES = 10 * 1024 * 1024;

export interface CoverCheck {
  ok: boolean;
  width: number;
  height: number;
  // Blocking problems first, then advice.
  errors: string[];
  warnings: string[];
}

// Same rules the help centre lists: square, ≥1000px, JPG/PNG, under 10 MB.
export async function checkCover(file: File): Promise<CoverCheck> {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!/^image\/(jpeg|png)$/.test(file.type)) errors.push('Use a JPG or PNG image.');
  if (file.size > COVER_MAX_BYTES) errors.push('Keep the file under 10 MB.');
  let width = 0;
  let height = 0;
  try {
    const bitmap = await createImageBitmap(file);
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  } catch {
    errors.push("This image couldn't be read.");
  }
  if (width && height) {
    if (Math.abs(width - height) > 2) errors.push(`Artwork must be square (this one is ${width}×${height}).`);
    if (Math.min(width, height) < COVER_MIN) errors.push(`Artwork must be at least ${COVER_MIN}×${COVER_MIN} pixels.`);
    else if (Math.min(width, height) < COVER_IDEAL) warnings.push(`${COVER_IDEAL}×${COVER_IDEAL} looks sharpest on big screens.`);
  }
  return { ok: errors.length === 0, width, height, errors, warnings };
}

const toBlob = (canvas: HTMLCanvasElement, type = 'image/jpeg') =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image'))), type, 0.92)
  );

async function ensureFonts() {
  try {
    await Promise.all([document.fonts.load('120px Dracutaz'), document.fonts.load('40px "Geist Mono"')]);
  } catch {
    // Fall back to system fonts.
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  lines.push(line);
  return lines.slice(0, 4);
}

// Yellow paper with the title in the brush face: the Unsigned poster look.
export async function makeSquareCover(title: string, artist: string, size = 1400): Promise<File> {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const u = size / 100;

  ctx.fillStyle = '#f2e600';
  ctx.fillRect(0, 0, size, size);
  // Speckle so it reads as printed paper.
  let seed = [...title].reduce((a, c) => a + c.charCodeAt(0), 7);
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  ctx.fillStyle = 'rgba(11,11,12,0.18)';
  for (let i = 0; i < 2600; i++) ctx.fillRect(rand() * size, rand() * size, rand() * 2.2, rand() * 2.2);

  // Black band with the artist name, like a poster's credit strip.
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 78 * u, size, 22 * u);
  ctx.fillStyle = '#f2e600';
  ctx.font = `${4.2 * u}px "Geist Mono", monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillText(artist.toUpperCase(), 7 * u, 89 * u);
  ctx.textAlign = 'right';
  ctx.fillText('UNSIGNED', 93 * u, 89 * u);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#0b0b0c';
  ctx.font = `${15 * u}px Dracutaz, Impact, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const lines = wrap(ctx, title.toUpperCase(), 86 * u);
  const lineHeight = 15 * u;
  const top = 44 * u - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 7 * u, top + i * lineHeight));

  // A scribble underline.
  ctx.strokeStyle = '#0b0b0c';
  ctx.lineWidth = 1.1 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const y = top + (lines.length - 1) * lineHeight + 6 * u;
  ctx.moveTo(7 * u, y);
  for (let x = 7; x <= 60; x += 6) ctx.quadraticCurveTo((x + 3) * u, y + (x % 12 ? -2 : 2) * u, (x + 6) * u, y);
  ctx.stroke();

  const blob = await toBlob(canvas);
  return new File([blob], 'cover.jpg', { type: 'image/jpeg' });
}

// 720×1280 frame for audio clips: square art in the middle, title and artist below.
export async function makeClipFrame(cover: Blob, title: string, artist: string): Promise<Blob> {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d')!;
  const bitmap = await createImageBitmap(cover);

  // Blurred, darkened copy of the art behind everything.
  ctx.filter = 'blur(40px) brightness(0.45)';
  const bg = Math.max(720 / bitmap.width, 1280 / bitmap.height) * 1.2;
  ctx.drawImage(bitmap, (720 - bitmap.width * bg) / 2, (1280 - bitmap.height * bg) / 2, bitmap.width * bg, bitmap.height * bg);
  ctx.filter = 'none';

  const side = 600;
  const x = 60;
  const y = 250;
  const scale = Math.max(side / bitmap.width, side / bitmap.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, side, side);
  ctx.clip();
  ctx.drawImage(bitmap, x + (side - bitmap.width * scale) / 2, y + (side - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
  ctx.restore();
  bitmap.close();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '64px Dracutaz, Impact, sans-serif';
  wrap(ctx, title.toUpperCase(), 620)
    .slice(0, 2)
    .forEach((l, i) => ctx.fillText(l, 360, 960 + i * 66));
  ctx.fillStyle = '#f2e600';
  ctx.font = '28px "Geist Mono", monospace';
  ctx.fillText(artist.toUpperCase(), 360, 1110);
  return toBlob(canvas);
}
