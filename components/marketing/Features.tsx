"use client";

import { useEffect, useState } from "react";

/**
 * Three features, auto-rotating: the active one carries its description and a
 * progress line that fills over the rotation period, then the stage swaps.
 * Clicking a title jumps to it and restarts the clock. React + CSS only.
 */

const ROTATION_MS = 9000;

const FEATURES: {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
}[] = [
  {
    eyebrow: "Market analysis",
    title: "Validated before it exists",
    description:
      "Research and market analysis run before a single file is written: who already solves this, who is asking for it, and where the gap actually is.",
    detail:
      "The score is computed from the evidence, so the model cannot talk its way past it.",
  },
  {
    eyebrow: "Simulate",
    title: "Tested on your segment first",
    description:
      "A synthetic panel drawn from your target segment meets the idea before any user does: what they reach for, what they object to, where they drop off.",
    detail:
      "Objections arrive while the framing is still cheap to change.",
  },
  {
    eyebrow: "Build",
    title: "A working app, not a chat log",
    description:
      "The builder inherits everything the earlier stages learned and writes real files into a live workspace, readable as they land, running in the preview.",
    detail:
      "What gets built is the version of the idea that survived.",
  },
  {
    eyebrow: "Market",
    title: "Launched, not just shipped",
    description:
      "The marketing agent takes the segment, the objections and the wedge the earlier stages found, and writes the launch copy and social posts for exactly those people.",
    detail:
      "It markets the product you actually built, to the audience the research named.",
  },
];

/** One glyph per feature: a gauge, a panel of people, a file. */
function FeatureIcon({
  index,
  className = "",
}: {
  index: number;
  className?: string;
}) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  if (index === 0) {
    return (
      <svg {...common}>
        <path d="M3.5 15a8.5 8.5 0 1 1 17 0" />
        <path d="M12 15l4-4" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M17 6.5a3 3 0 0 1 0 6M18.5 20a6 6 0 0 0-3-5.2" />
      </svg>
    );
  }
  if (index === 3) {
    return (
      <svg {...common}>
        <path d="M4 10v4a1 1 0 0 0 1 1h2.5L14 19V5L7.5 9H5a1 1 0 0 0-1 1Z" />
        <path d="M17.5 9.5a4 4 0 0 1 0 5" />
        <path d="M7.5 15v4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M10.5 12.5 9 14l1.5 1.5M14 12.5 15.5 14 14 15.5" />
    </svg>
  );
}

/* ---- stage visuals: the product's own light UI, one per feature ---------- */

function StageScore() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-5 p-7">
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--rule)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            className="arc-draw"
            style={{ "--arc-rest": 20 } as React.CSSProperties}
          />
        </svg>
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
            Market score
          </span>
          <p className="display text-[3rem] leading-none text-ink">
            8<span className="text-[1.25rem] text-ink-faint">/10</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          ["Chaser", "priced for accounting teams"],
          ["Upflow", "mid-market, not solo"],
          ["A spreadsheet", "the actual incumbent"],
        ].map(([name, note]) => (
          <div
            key={name}
            className="flex items-baseline justify-between rounded-[8px] bg-sunk px-3.5 py-2.5"
          >
            <span className="text-[13px] font-medium text-ink">{name}</span>
            <span className="text-[11px] text-ink-soft">{note}</span>
          </div>
        ))}
      </div>

      <p className="border-l-2 border-rule-strong pl-3 text-[12px] leading-[1.55] text-ink-soft">
        Gap is pricing and audience, not features. R1 Stripe-only coverage, R2
        automated-sounding copy.
      </p>
    </div>
  );
}

function StageSimulate() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-5 p-7">
      <div>
        <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
          Synthetic panel · 12 users from the segment
        </span>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="relative h-14 flex-1 overflow-hidden rounded-[4px] bg-rule"
            >
              {i < 7 && (
                <span
                  className="fill-y absolute inset-0 bg-ink"
                  style={{ "--d": `${i * 90}ms` } as React.CSSProperties}
                />
              )}
            </span>
          ))}
        </div>
        <p className="mt-2.5 text-[12px] text-ink-soft">
          7 would adopt · 3 unsure · 2 would not
        </p>
      </div>

      <div className="rounded-[8px] border border-rule bg-sunk p-3.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
          Strongest objection
        </span>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink">
          They forgive the first week late and want the tool to wait, not chase
          immediately.
        </p>
      </div>
    </div>
  );
}

function StageBuild() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-7">
      <div className="space-y-1.5 font-mono text-[11px] text-ink-soft">
        {[
          "> builder agent invoked",
          "> wrote App.jsx",
          "> wrote README.md",
          "> done, 2 files generated",
        ].map((line, i) => (
          <p
            key={line}
            className="type-line whitespace-nowrap"
            style={{ "--d": `${i * 420}ms` } as React.CSSProperties}
          >
            {line}
            {i === 3 && (
              <span className="caret ml-1 inline-block h-[10px] w-[5px] translate-y-[1px] bg-ink-soft" />
            )}
          </p>
        ))}
      </div>
      <div className="flex-1 rounded-[8px] bg-[#111110] p-4 font-mono text-[10.5px] leading-[1.75] text-[#d6d3cc]">
        {`function App() {
  const [invoices, setInvoices] =
    React.useState(SEED);

  const outstanding = invoices
    .filter((i) => !i.chased)
    .reduce((s, i) => s + i.amount, 0);
  ...`}
      </div>
    </div>
  );
}

function StageMarket() {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 p-7">
      <span className="font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
        Drafted for the segment
      </span>
      {[
        ["X", "Every freelancer has that one client who pays on day 34. We wrote the follow-up so you don't have to."],
        ["LinkedIn", "Chasing invoices is the least fun part of going solo. Here is what changed when it got automated."],
        ["Reddit r/freelance", "Built the polite-but-firm reminder I always struggled to write. Free while it is in beta."],
      ].map(([where, copy]) => (
        <div key={where} className="rounded-[8px] border border-rule bg-sunk p-3">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.09em] text-ink-faint">
            {where}
          </span>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-ink">{copy}</p>
        </div>
      ))}
    </div>
  );
}

const STAGES = [StageScore, StageSimulate, StageBuild, StageMarket];

/* ------------------------------------------------------------------------- */

export default function Features() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => setActive((a) => (a + 1) % FEATURES.length),
      ROTATION_MS,
    );
    return () => clearTimeout(t);
  }, [active]);

  const Stage = STAGES[active];

  return (
    <section id="features" className="scroll-mt-28 px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-[68rem]">
        <div className="mb-16 text-center">
          <h2 className="display mx-auto max-w-[20ch] text-[2rem] sm:text-[3rem]">
            What can Multiplyer do for you?
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-[1.6] text-chalk-soft">
            Three things a chat window cannot: it checks the market before it
            writes, tests the idea on your segment, and hands the builder
            everything the earlier stages learned.
          </p>
        </div>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* left: titles; the active one opens */}
          <ol>
            {FEATURES.map((f, i) => {
              const isActive = i === active;
              return (
                <li
                  key={f.title}
                  className={i > 0 ? "border-t border-edge" : undefined}
                >
                  <button
                    onClick={() => setActive(i)}
                    className="group/row block w-full py-6 text-left"
                  >
                    <h3
                      className={`display flex items-center gap-3 text-[1.5rem] transition-colors duration-300 sm:text-[1.9rem] ${
                        isActive
                          ? "text-chalk"
                          : "text-chalk-faint group-hover/row:text-chalk"
                      }`}
                    >
                      <FeatureIcon
                        index={i}
                        className={`shrink-0 transition-colors duration-300 ${
                          isActive ? "text-chalk" : "text-chalk-faint"
                        }`}
                      />
                      {f.title}
                    </h3>

                    {isActive && (
                      <div className="stage-in">
                        <p className="mt-4 max-w-[46ch] text-[14px] leading-[1.7] text-chalk-soft">
                          {f.description}
                        </p>
                        <p className="mt-3 max-w-[46ch] text-[14px] leading-[1.7] text-chalk-faint">
                          {f.detail}
                        </p>

                        {/* rotation progress */}
                        <div className="mt-6 h-px w-full overflow-hidden bg-edge">
                          <span
                            key={active}
                            className="progress-x block h-full bg-chalk/85"
                            style={{ "--rot": `${ROTATION_MS}ms` } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* stage inline on small screens */}
                  {isActive && (
                    <div className="mb-6 lg:hidden">
                      <div className="overflow-hidden rounded-[18px] border border-edge bg-surface">
                        <Stage />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* right: the stage */}
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[24px] border border-edge bg-void-2 lg:block">
            {/* corner light, so the shell reads as a lit surface */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.08),transparent_40%)]"
            />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div
                key={active}
                className="stage-in h-full w-full overflow-hidden rounded-[14px] border border-rule bg-surface shadow-[0_30px_90px_-25px_rgba(0,0,0,0.9)]"
              >
                <div className="flex h-[34px] items-center gap-1.5 border-b border-rule px-3.5">
                  <span className="h-[8px] w-[8px] rounded-full bg-rule-strong" />
                  <span className="h-[8px] w-[8px] rounded-full bg-rule-strong" />
                  <span className="h-[8px] w-[8px] rounded-full bg-rule-strong" />
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.09em] text-ink-faint">
                    {FEATURES[active].eyebrow}
                  </span>
                </div>
                <div className="h-[calc(100%-34px)]">
                  <Stage />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
