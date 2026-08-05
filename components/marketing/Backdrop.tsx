/**
 * The site's living background, in three layers:
 *
 *  1. Aurora — blue colour bodies that drift AND pulse in brightness. The
 *     pulse is the point: a blob crossing 12px a second is perceptually
 *     static, the same blob brightening is not.
 *  2. Glow bands — wide soft sheets of light crossing the page edge to edge.
 *     This is the layer you actually catch moving.
 *  3. Dot patches — the fine lattice, breathing and crawling, with a band of
 *     light sweeping a brighter grid through them.
 */

const PATCHES: {
  className: string;
  o: number;
  t: number;
  d: number;
  sweep: number;
}[] = [
  // beside the hero, upper right
  { className: "right-[-3%] top-[3%] h-[460px] w-[520px]", o: 0.9, t: 8, d: 0, sweep: 6.5 },
  // upper left, under the hero copy
  { className: "left-[-5%] top-[14%] h-[380px] w-[440px]", o: 0.7, t: 10, d: 3200, sweep: 8.5 },
  // mid right, beside the features stage
  { className: "right-[1%] top-[36%] h-[400px] w-[460px]", o: 0.8, t: 9, d: 1600, sweep: 7.5 },
  // mid left, along the path section
  { className: "left-[-4%] top-[54%] h-[420px] w-[460px]", o: 0.75, t: 11, d: 4800, sweep: 9 },
  // lower right, near the orbit
  { className: "right-[4%] top-[72%] h-[360px] w-[420px]", o: 0.8, t: 9, d: 2400, sweep: 7 },
  // near the footer, left
  { className: "left-[6%] top-[90%] h-[320px] w-[400px]", o: 0.65, t: 10, d: 5600, sweep: 8 },
];

/**
 * Colour bodies. Alpha is high enough to survive the 70px blur — the earlier
 * pass sat around 0.12, which after blurring resolved to roughly two levels
 * of blue on black and read as nothing at all.
 */
const AURORAS: { className: string; rgb: string; alpha: number }[] = [
  {
    className: "aurora-a left-[-14%] top-[-8%] h-[620px] w-[720px]",
    rgb: "var(--aurora-1)",
    alpha: 0.42,
  },
  {
    className: "aurora-b right-[-16%] top-[18%] h-[560px] w-[660px]",
    rgb: "var(--aurora-2)",
    alpha: 0.3,
  },
  {
    className: "aurora-c left-[4%] top-[40%] h-[600px] w-[700px]",
    rgb: "var(--aurora-3)",
    alpha: 0.34,
  },
  {
    className: "aurora-b right-[-10%] top-[62%] h-[560px] w-[640px]",
    rgb: "var(--aurora-1)",
    alpha: 0.32,
  },
  {
    className: "aurora-a left-[-8%] top-[84%] h-[520px] w-[620px]",
    rgb: "var(--aurora-3)",
    alpha: 0.26,
  },
];

/** Wide sheets of light crossing the page, on periods that never align. */
const BANDS: { top: string; height: string; rgb: string; alpha: number; t: number; d: number }[] = [
  { top: "0%", height: "70%", rgb: "var(--aurora-1)", alpha: 0.16, t: 17, d: 0 },
  { top: "38%", height: "60%", rgb: "var(--aurora-2)", alpha: 0.12, t: 23, d: -9 },
  { top: "70%", height: "60%", rgb: "var(--aurora-3)", alpha: 0.13, t: 29, d: -5 },
];

export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {AURORAS.map((a, i) => (
        <div
          key={`aurora-${i}`}
          className={`aurora ${a.className}`}
          style={{
            background: `radial-gradient(circle, rgba(${a.rgb}, ${a.alpha}) 0%, transparent 70%)`,
          }}
        />
      ))}

      {BANDS.map((b, i) => (
        <div
          key={`band-${i}`}
          className="absolute inset-x-0 overflow-hidden"
          style={{ top: b.top, height: b.height }}
        >
          <div
            className="glow-band"
            style={
              {
                "--t": `${b.t}s`,
                "--d": `${b.d}s`,
                background: `linear-gradient(90deg, transparent, rgba(${b.rgb}, ${b.alpha}), transparent)`,
              } as React.CSSProperties
            }
          />
        </div>
      ))}

      {PATCHES.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.className} [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent_74%)]`}
        >
          {/* base grid: breathes and crawls (one declaration — see globals) */}
          <div
            className="dot-field dots-live absolute inset-0"
            style={
              {
                "--o": p.o,
                "--t": `${p.t}s`,
                "--d": `${p.d}ms`,
              } as React.CSSProperties
            }
          />
          {/* bright grid: revealed by the travelling band of light */}
          <div
            className="dot-field-bright dots-sweep absolute inset-0"
            style={
              {
                "--sweep": `${p.sweep}s`,
                "--d": `${p.d}ms`,
              } as React.CSSProperties
            }
          />
        </div>
      ))}
    </div>
  );
}
