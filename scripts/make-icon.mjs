/**
 * Generates build/icon.png (512x512 RGBA) — the app icon electron-builder
 * converts into .ico/.icns at package time. Hand-rolled PNG encoder over
 * node:zlib so the repo needs no image tooling.
 *
 * The mark is the same two polygons the site draws (lid + M-cut body), given
 * here in the 64-unit viewBox so the two can never drift apart. Filled by
 * point-in-polygon with 4x4 supersampling, which is simpler and more faithful
 * for solid shapes than the signed-distance approach the old chevron needed.
 *
 * Run: node scripts/make-icon.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SIZE = 512;

// ---- colours ---------------------------------------------------------------

const BG = [11, 11, 13]; // #0b0b0d — the tile
const MARK = [246, 245, 242]; // chalk

// ---- geometry --------------------------------------------------------------

const RADIUS = SIZE * 0.225; // tile corner radius
const INSET = 0.78; // mark occupies 78% of the tile, centred

/** Lid, then body — identical to components/marketing/Mark.tsx. */
const POLYS_64 = [
  [
    [32, 2],
    [58, 16],
    [32, 30],
    [6, 16],
  ],
  [
    [6, 20],
    [6, 44],
    [16, 49.5],
    [16, 34],
    [32, 43],
    [48, 34],
    [48, 49.5],
    [58, 44],
    [58, 20],
    [32, 34],
  ],
];

/** 64-unit space -> pixel space, scaled about the tile centre. */
const K = (SIZE / 64) * INSET;
const OFF = SIZE / 2 - 32 * K;
const POLYS = POLYS_64.map((poly) =>
  poly.map(([x, y]) => [x * K + OFF, y * K + OFF]),
);

/** Standard ray-casting test. */
function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

const SS = 4; // supersample grid per axis

/** Coverage of the mark at this pixel, 4x4 supersampled for clean edges. */
function markCoverage(x, y) {
  let hits = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const px = x + (sx + 0.5) / SS;
      const py = y + (sy + 0.5) / SS;
      if (POLYS.some((poly) => pointInPolygon(px, py, poly))) hits++;
    }
  }
  return hits / (SS * SS);
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

    const cov = markCoverage(x, y);
    if (cov > 0) {
      r = r + (MARK[0] - r) * cov;
      g = g + (MARK[1] - g) * cov;
      b = b + (MARK[2] - b) * cov;
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
