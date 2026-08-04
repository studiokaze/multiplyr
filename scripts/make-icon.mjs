/**
 * Generates build/icon.png (512x512 RGBA) — the app icon electron-builder
 * converts into .ico/.icns at package time. Hand-rolled PNG encoder over
 * node:zlib so the repo needs no image tooling: the mark is rasterised
 * analytically (signed distances + 1px antialiasing), matching the site's
 * chevron glyph on the dark tile.
 *
 * Run: node scripts/make-icon.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SIZE = 512;

// ---- colours ---------------------------------------------------------------

const BG = [11, 11, 13]; // #0b0b0d — the tile
const CHEVRON = [246, 245, 242]; // chalk
const DASH = [233, 180, 76]; // signal amber

// ---- geometry (scaled from the 16px viewBox of the site's Mark) ------------

const S = SIZE / 16;
const STROKE = 1.7 * S; // stroke width
const RADIUS = SIZE * 0.225; // tile corner radius

const CHEVRON_SEGS = [
  [3.1 * S, 4.1 * S, 7.1 * S, 8.0 * S],
  [7.1 * S, 8.0 * S, 3.1 * S, 11.9 * S],
];
const DASH_SEG = [9.0 * S, 11.9 * S, 13.1 * S, 11.9 * S];

// ---- signed distances ------------------------------------------------------

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq),
  );
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Coverage of a round-capped stroke at this pixel, with a 1px AA band. */
function strokeCoverage(px, py, segs) {
  let d = Infinity;
  for (const [x1, y1, x2, y2] of segs) {
    d = Math.min(d, distToSegment(px, py, x1, y1, x2, y2));
  }
  return Math.max(0, Math.min(1, STROKE / 2 + 0.5 - d));
}

/** Coverage of the rounded-square tile. */
function tileCoverage(px, py) {
  const half = SIZE / 2;
  const bx = half - RADIUS;
  const qx = Math.max(Math.abs(px - half) - bx, 0);
  const qy = Math.max(Math.abs(py - half) - bx, 0);
  const sd = Math.hypot(qx, qy) - RADIUS;
  return Math.max(0, Math.min(1, 0.5 - sd));
}

// ---- rasterise -------------------------------------------------------------

const pixels = Buffer.alloc(SIZE * SIZE * 4);

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const px = x + 0.5;
    const py = y + 0.5;

    const tile = tileCoverage(px, py);
    let r = BG[0];
    let g = BG[1];
    let b = BG[2];

    const chev = strokeCoverage(px, py, CHEVRON_SEGS);
    if (chev > 0) {
      r = r + (CHEVRON[0] - r) * chev;
      g = g + (CHEVRON[1] - g) * chev;
      b = b + (CHEVRON[2] - b) * chev;
    }

    const dash = strokeCoverage(px, py, [DASH_SEG]);
    if (dash > 0) {
      r = r + (DASH[0] - r) * dash;
      g = g + (DASH[1] - g) * dash;
      b = b + (DASH[2] - b) * dash;
    }

    const i = (y * SIZE + x) * 4;
    pixels[i] = Math.round(r);
    pixels[i + 1] = Math.round(g);
    pixels[i + 2] = Math.round(b);
    pixels[i + 3] = Math.round(tile * 255);
  }
}

// ---- encode PNG ------------------------------------------------------------

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // colour type: RGBA
// compression 0, filter 0, interlace 0

// Scanlines, each prefixed with filter byte 0.
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (SIZE * 4 + 1);
  raw[rowStart] = 0;
  pixels.copy(raw, rowStart + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = path.join(process.cwd(), "build", "icon.png");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, png);
console.log(`wrote ${out} (${png.length} bytes, ${SIZE}x${SIZE} RGBA)`);
