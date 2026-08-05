/**
 * The site's living background: pitch black, monochrome, moving everywhere —
 * the 10x register. Three layers, all white-on-black, no colour washes:
 *
 *  1. A full-bleed dot lattice that breathes and crawls under the whole page,
 *     so no viewport is ever still.
 *  2. Brighter dot patches where sweeps of light travel through the grid.
 *  3. Two soft white sheets crossing the page edge to edge — the motion you
 *     catch from the corner of your eye.
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
  // mid left, along the pricing run
  { className: "left-[-4%] top-[54%] h-[420px] w-[460px]", o: 0.75, t: 11, d: 4800, sweep: 9 },
  // lower right, by the FAQ
  { className: "right-[4%] top-[72%] h-[360px] w-[420px]", o: 0.8, t: 9, d: 2400, sweep: 7 },
  // near the footer, left
  { className: "left-[6%] top-[90%] h-[320px] w-[400px]", o: 0.65, t: 10, d: 5600, sweep: 8 },
];

/** White light sheets, faint and wide, on periods that never align. */
const BANDS: { top: string; height: string; alpha: number; t: number; d: number }[] = [
  { top: "0%", height: "60%", alpha: 0.045, t: 19, d: 0 },
  { top: "45%", height: "55%", alpha: 0.035, t: 27, d: -11 },
];

export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* the whole page sits on a faint living lattice */}
      <div
        className="dot-field dots-live absolute inset-0"
        style={{ "--o": 0.35, "--t": "12s" } as React.CSSProperties}
      />

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
                background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, ${b.alpha}), transparent)`,
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
