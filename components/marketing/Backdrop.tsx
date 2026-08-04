/**
 * The site's living background: dot-matrix patches down the whole page.
 * Each patch is two layers — a base grid that breathes and crawls one cell
 * per cycle, and a brighter grid revealed only by a band of light sweeping
 * through it. The sweep is the visible life; the breathe is the undertone.
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

export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {PATCHES.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.className} [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent_74%)]`}
        >
          {/* base grid: breathes and crawls */}
          <div
            className="dot-field dots-breathe dots-crawl absolute inset-0"
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
            className="dot-field-bright dots-sweep dots-crawl absolute inset-0"
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
