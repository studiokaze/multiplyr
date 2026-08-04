/**
 * "Built to blend in" — the stack the builder generates for, presented the
 * way 10x does it: app-icon style tiles resting on a thin circle, our own
 * dark tile at the centre, a dot-matrix cluster as corner decoration.
 *
 * The ring drifts very slowly (ambient, not scroll-linked); each tile
 * counter-rotates so it stays upright. Tiles use simple monograms and
 * generic glyphs in each brand's colour rather than reproducing their
 * trademarked marks.
 */

const TILES: {
  name: string;
  angle: number;
  bg: string;
  glyph: React.ReactNode;
}[] = [
  {
    name: "Claude",
    angle: 315,
    bg: "bg-[#f5f0e8]",
    // generic sunburst in Claude's terracotta
    glyph: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={i}
            x1="12"
            y1="12"
            x2={12 + 9 * Math.cos((i * Math.PI) / 4)}
            y2={12 + 9 * Math.sin((i * Math.PI) / 4)}
            stroke="#D97757"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ))}
      </svg>
    ),
  },
  {
    name: "ChatGPT",
    angle: 30,
    bg: "bg-white",
    // generic hex-loop, not the actual knot
    glyph: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.5l7 4v9l-7 4-7-4v-9l7-4z"
          stroke="#0f0f0f"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3.1" stroke="#0f0f0f" strokeWidth="1.9" />
      </svg>
    ),
  },
  {
    name: "Supabase",
    angle: 100,
    bg: "bg-[#1c1c22]",
    // generic bolt in Supabase green
    glyph: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#3ECF8E" aria-hidden="true">
        <path d="M13.2 2.2L5 13.4h5.4L10.8 21.8 19 10.6h-5.4l-.4-8.4z" />
      </svg>
    ),
  },
  {
    name: "Superwall",
    angle: 190,
    bg: "bg-[#1c1c22]",
    glyph: (
      <span className="font-mono text-[15px] font-bold tracking-tight text-[#5fd4c4]">
        $W
      </span>
    ),
  },
  {
    name: "NOWPayments",
    angle: 255,
    bg: "bg-white",
    glyph: (
      <span className="font-mono text-[15px] font-bold tracking-tight text-[#4a8fe7]">
        N
      </span>
    ),
  },
];

function Tile({
  bg,
  name,
  children,
}: {
  bg: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={name}
      className={`orbit-tile flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-white/10 ${bg} shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)]`}
    >
      {children}
    </span>
  );
}

/** Slow enough to be calm, fast enough to be seen moving. */
const ORBIT_S = 36;

export default function Orbit() {
  const R = 156; // orbit radius in px

  return (
    <section
      id="stack"
      className="relative scroll-mt-28 overflow-hidden px-6 py-16 sm:px-10"
    >
      {/* corner dot-matrix cluster, as in the reference */}
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
            The builder writes apps for the stack you already ship on — auth,
            data, payments and the models underneath.
          </p>
        </div>

        <div className="relative mx-auto mt-2 flex h-[420px] max-w-[460px] items-center justify-center">
          {/*
            The rotating disc IS the orbit track: its border draws the circle,
            and tiles sit on that border at plain trig positions, so track and
            tiles can never drift apart. The disc spins; each tile runs the
            same rotation in reverse to stay upright.
          */}
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
            {TILES.map((t) => {
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
                    <Tile bg={t.bg} name={t.name}>
                      {t.glyph}
                    </Tile>
                  </div>
                </div>
              );
            })}
          </div>

          {/*
            A signal circulating the ring, three times faster than the tiles.
            Reads as traffic between the centre and the stack rather than
            decoration, and it is the one moving thing here that is ours.
          */}
          <div
            aria-hidden="true"
            className="orbit-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={
              {
                width: R * 2,
                height: R * 2,
                "--orbit-t": `${ORBIT_S / 3}s`,
              } as React.CSSProperties
            }
          >
            <span className="pulse-glow absolute left-1/2 top-0 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_2px_rgba(233,180,76,0.55)]" />
          </div>

          {/* our tile, centre — larger and dark */}
          <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-[18px] border border-white/10 bg-[#141418] shadow-[0_30px_80px_-16px_rgba(0,0,0,0.95)]">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M2.5 3.5L6.5 8L2.5 12.5"
                stroke="#f6f5f2"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 12.5H13.5"
                stroke="#f6f5f2"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.55"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
