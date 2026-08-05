"use client";

import { useEffect, useRef, useState } from "react";
import WorkspaceShot from "./WorkspaceShot";

/**
 * "See it in action" — the product-video slot, without a video. Pressing play
 * runs a scripted take of a real run inside the card: the idea is typed in,
 * the stages light up in order with their outputs, the builder writes files,
 * and the preview fills. Staged DOM with timed steps, so the film is always
 * sharp, weighs nothing, and cannot drift from the real UI.
 */

const IDEA = "a tool that helps freelancers chase late invoices";

/** step -> ms from pressing play. Elements appear when step is reached. */
const TIMELINE: number[] = [
  0, // 0 window
  400, // 1 idea typing starts
  2600, // 2 stage 01
  3600, // 3 stage 02
  4600, // 4 stage 03
  5600, // 5 simulate card
  7200, // 6 stage 05 label
  7600, // 7 build line 1
  8200, // 8 build line 2
  8800, // 9 build line 3
  9300, // 10 files pane
  10000, // 11 preview head
  10400, // 12 preview row 1
  10800, // 13 preview row 2
  11200, // 14 preview row 3
  11900, // 15 market line
  12800, // 16 replay affordance
];

const CODE = `function App() {
  const [invoices, setInvoices] = React.useState(SEED);

  const outstanding = invoices
    .filter((i) => !i.chased)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-semibold">Overdue</h1>`;

const STAGES: [string, string, string, number][] = [
  ["01", "Brainstorm", "3 framings", 2],
  ["02", "Research", "4 competitors · 3 signals", 3],
  ["03", "Market analysis", "Gap: pricing, not features", 4],
];

const BUILD_LINES: [string, number][] = [
  ["> wrote App.jsx", 7],
  ["> wrote README.md", 8],
  ["> done, 2 files generated", 9],
];

const PREVIEW_ROWS: [string, string, string, boolean, number][] = [
  ["Northwind", "INV-014", "21 days late", false, 12],
  ["Acme Studio", "INV-018", "6 days late", false, 13],
  ["Bluebird", "INV-021", "34 days late", true, 14],
];

function El({
  on,
  className = "",
  children,
}: {
  on: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`film-el ${on ? "film-on" : ""} ${className}`}>
      {children}
    </div>
  );
}

function PaneHead({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex h-[30px] shrink-0 items-center justify-between border-b border-rule px-3">
      <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
        {title}
      </span>
      {meta && (
        <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
          {meta}
        </span>
      )}
    </div>
  );
}

/** One take of the film. Remounted (new key) for replay. */
function FilmRun({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const doneRef = useRef(onDone);

  // Kept fresh in an effect: refs must not be written during render.
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timers = TIMELINE.map((ms, i) =>
      window.setTimeout(() => {
        setStep(i);
        if (i === TIMELINE.length - 1) doneRef.current();
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // The idea types itself while step 1 is live.
  useEffect(() => {
    if (step < 1) return;
    const iv = window.setInterval(() => {
      setTyped((t) =>
        t.length < IDEA.length ? IDEA.slice(0, t.length + 1) : t,
      );
    }, 38);
    return () => clearInterval(iv);
  }, [step]);

  const s = (n: number) => step >= n;

  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-[14px] border border-edge bg-void-2">
      <div className="flex h-[38px] items-center gap-2 border-b border-edge px-4">
        <span className="h-[10px] w-[10px] rounded-full bg-white/12" />
        <span className="h-[10px] w-[10px] rounded-full bg-white/12" />
        <span className="h-[10px] w-[10px] rounded-full bg-white/12" />
        <span className="mx-auto font-mono text-[10px] tracking-[0.06em] text-chalk-faint">
          Multiplyer
        </span>
      </div>

      <div className="grid min-h-[380px] grid-cols-[1.2fr_1fr_1fr] gap-px bg-rule">
        {/* left rail: the run happening */}
        <div className="flex min-w-0 flex-col bg-surface">
          <div className="border-b border-rule px-3 py-2.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
              Idea
            </span>
            <p className="mt-1 min-h-[14px] text-[10px] leading-[1.45] text-ink">
              {typed}
              {s(1) && typed.length < IDEA.length && (
                <span className="caret ml-px inline-block h-[10px] w-[5px] translate-y-[1.5px] bg-ink align-baseline" />
              )}
            </p>
          </div>

          {STAGES.map(([n, label, meta, at]) => (
            <El key={n} on={s(at)} className="border-b border-rule px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-[4px] w-[4px] rounded-full bg-ink" />
                <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                  {n}
                </span>
                <span className="text-[9.5px] font-medium text-ink">
                  {label}
                </span>
              </div>
              <p className="mt-1 pl-[14px] text-[9px] text-ink-soft">{meta}</p>
            </El>
          ))}

          <El on={s(5)} className="border-b border-rule px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[4px] w-[4px] rounded-full bg-ink" />
              <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                04
              </span>
              <span className="text-[9.5px] font-medium text-ink">Simulate</span>
            </div>
            <div className="mt-2 overflow-hidden rounded-[6px] border border-rule bg-sunk">
              <div className="flex items-end justify-between px-2.5 pt-2.5">
                <div>
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-ink-faint">
                    Would adopt
                  </span>
                  <p className="display text-[15px] text-ink">7 of 12</p>
                </div>
                <p className="font-mono text-[9px] leading-none text-ink-soft">
                  synthetic
                  <br />
                  users
                </p>
              </div>
              <div className="mt-2 border-t border-rule bg-surface px-2.5 py-2">
                <p className="text-[8.5px] leading-[1.5] text-ink">
                  Strongest objection: they already forgive the first week late
                  and want the tool to wait, not to chase immediately.
                </p>
              </div>
            </div>
          </El>

          <El on={s(6)} className="border-b border-rule px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[4px] w-[4px] rounded-full bg-ink" />
              <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                05
              </span>
              <span className="text-[9.5px] font-medium text-ink">Build</span>
            </div>
            <div className="mt-1.5 space-y-1 pl-[14px] font-mono text-[8px] text-ink-soft">
              {BUILD_LINES.map(([line, at]) => (
                <El key={line} on={s(at)}>
                  <p>{line}</p>
                </El>
              ))}
            </div>
          </El>

          <El on={s(15)} className="px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[4px] w-[4px] rounded-full bg-ink" />
              <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                06
              </span>
              <span className="text-[9.5px] font-medium text-ink">Market</span>
            </div>
            <p className="mt-1 pl-[14px] text-[9px] text-ink-soft">
              3 posts drafted · X, LinkedIn, r/freelance
            </p>
          </El>
        </div>

        {/* middle: files */}
        <div className="flex min-w-0 flex-col bg-surface">
          <PaneHead title="Files" meta={s(10) ? "2 files" : undefined} />
          <El on={s(10)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 gap-1 border-b border-rule px-2 py-1.5">
              {["App.jsx", "README.md"].map((f, i) => (
                <span
                  key={f}
                  className={`rounded-[3px] px-1.5 py-0.5 font-mono text-[8px] ${
                    i === 0
                      ? "bg-ink text-paper"
                      : "border border-rule text-ink-soft"
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
            <pre className="flex-1 overflow-hidden bg-[#111110] p-2.5 font-mono text-[7.5px] leading-[1.7] text-[#d6d3cc]">
              <code>{CODE}</code>
            </pre>
          </El>
        </div>

        {/* right: the generated app coming alive */}
        <div className="flex min-w-0 flex-col bg-surface">
          <PaneHead title="Preview" meta={s(11) ? "Reload" : undefined} />
          <div className="flex-1 bg-neutral-50 p-3">
            <El on={s(11)}>
              <p className="text-[11px] font-semibold text-neutral-900">
                Overdue
              </p>
              <p className="mt-0.5 text-[7.5px] text-neutral-500">
                $3,300 unchased
              </p>
            </El>
            <div className="mt-2.5 space-y-1.5">
              {PREVIEW_ROWS.map(([client, id, late, chased, at]) => (
                <El
                  key={id}
                  on={s(at)}
                  className="flex items-center justify-between rounded-[5px] border border-neutral-200 bg-white p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[8px] font-medium text-neutral-900">
                      {client}
                    </p>
                    <p className="truncate text-[7px] text-neutral-500">
                      {id} · {late}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-[3px] px-1.5 py-[3px] text-[7px] text-white ${
                      chased ? "bg-neutral-900/40" : "bg-neutral-900"
                    }`}
                  >
                    {chased ? "Chased" : "Send chase"}
                  </span>
                </El>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayPill({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="spring-hover pointer-events-auto flex items-center gap-2.5 rounded-full bg-void/85 py-3 pl-6 pr-3.5 text-[14px] font-medium text-chalk backdrop-blur-md"
    >
      {label}
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-chalk">
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2.5 1.5 8.5 5 2.5 8.5Z" fill="#000" />
        </svg>
      </span>
    </button>
  );
}

export default function Film() {
  // take 0 = poster; each play increments so FilmRun fully remounts.
  const [take, setTake] = useState(0);
  const [ended, setEnded] = useState(false);

  const play = () => {
    setEnded(false);
    setTake((t) => t + 1);
  };

  return (
    <section className="scroll-mt-28 px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-[62rem]">
        <div className="text-center">
          <p className="label">Product film</p>
          <h2 className="brand mx-auto mt-3 text-[1.3rem] sm:text-[1.9rem]">
            See Multiplyer in action
          </h2>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[20px] border border-edge bg-void-2 p-3 sm:p-4">
          {take === 0 ? (
            <>
              {/* poster: the workspace at rest, dimmed under the pill */}
              <div className="opacity-40 blur-[1.5px]">
                <WorkspaceShot />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayPill label="Watch it run" onClick={play} />
              </div>
            </>
          ) : (
            <>
              <FilmRun key={take} onDone={() => setEnded(true)} />
              {ended && (
                <div className="absolute bottom-7 right-7">
                  <PlayPill label="Replay" onClick={play} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
