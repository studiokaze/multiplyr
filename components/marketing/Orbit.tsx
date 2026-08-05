import { STACK_TILES } from "./stack";

/**
 * "Built to blend in" — the stack the builder generates for: app-icon style
 * tiles resting on a thin circle with our own tile at the centre.
 *
 * The rotating disc IS the orbit track: its border draws the circle and tiles
 * sit on that border at plain trigonometric positions, so track and tiles can
 * never drift apart. The disc spins; each tile runs the same rotation in
 * reverse to stay upright.
 */

/** Slow enough to be calm, fast enough to be seen moving. */
const ORBIT_S = 36;

export default function Orbit() {
  const R = 200; // orbit radius in px

  return (
    <section
      id="stack"
      className="relative scroll-mt-28 overflow-hidden px-6 py-16 sm:px-10"
    >
      <div
        aria-hidden="true"
        className="dot-field pointer-events-none absolute right-[4%] top-[16%] h-[340px] w-[380px] opacity-[0.5] [mask-image:radial-gradient(ellipse_60%_60%_at_60%_40%,black,transparent_72%)]"
      />

      <div className="relative mx-auto max-w-[62rem]">
        <div className="text-center">
          <h2 className="display mx-auto max-w-[16ch] text-[1.75rem] sm:text-[2.5rem]">
            Built to blend in.
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-[14px] leading-[1.65] text-chalk-soft">
            The builder writes apps for the stack you already ship on: auth,
            data, payments, hosting and the models underneath.
          </p>
        </div>

        <div className="relative mx-auto mt-2 flex h-[540px] max-w-[600px] items-center justify-center">
          <div
            aria-hidden="true"
            className="orbit-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]"
            style={
              {
                width: R * 2,
                height: R * 2,
                "--orbit-t": `${ORBIT_S}s`,
              } as React.CSSProperties
            }
          >
            {STACK_TILES.map((t) => {
              const rad = (t.angle * Math.PI) / 180;
              const left = 50 + 50 * Math.sin(rad);
              const top = 50 - 50 * Math.cos(rad);
              return (
                <div
                  key={t.name}
                  className="absolute"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div
                    className="orbit-item -translate-x-1/2 -translate-y-1/2"
                    style={
                      {
                        "--orbit-t": `${ORBIT_S}s`,
                        animationDirection: "reverse",
                      } as React.CSSProperties
                    }
                  >
                    <span
                      title={t.name}
                      className={`orbit-tile flex h-[96px] w-[96px] items-center justify-center rounded-[24px] border border-white/10 ${t.bg} shadow-[0_24px_60px_-14px_rgba(0,0,0,0.9)]`}
                    >
                      <svg
                        width="46"
                        height="46"
                        viewBox="0 0 24 24"
                        fill={t.fill}
                        role="img"
                        aria-label={t.name}
                      >
                        <path d={t.path} />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* our tile, centre */}
          <div className="relative z-10 flex h-[112px] w-[112px] items-center justify-center rounded-[28px] border border-white/10 bg-[#141418] shadow-[0_30px_80px_-16px_rgba(0,0,0,0.95)]">
            <svg width="46" height="46" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2.5 3.5L6.5 8L2.5 12.5"
                stroke="#f6f5f2"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 12.5H13.5"
                stroke="#e9b44c"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
