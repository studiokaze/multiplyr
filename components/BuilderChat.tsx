"use client";

import { useEffect, useRef, useState } from "react";
import {
  AspectRadar,
  ChartSafe,
  DemandFlow,
  DemandMap,
  InterestBars,
} from "@/components/charts";
import NicheMap from "@/components/NicheMap";
import type {
  AnalysisResult,
  BrainstormResult,
  Framing,
  MarketingResult,
  ResearchResult,
  SimulationResult,
  StageId,
  StageStatus,
  Stages,
} from "@/lib/types";

const STAGE_META: Record<
  StageId,
  { n: string; label: string; dept: string; wait: string }
> = {
  brainstorm: { n: "01", label: "Brainstorm", dept: "Product", wait: "Waiting for your idea" },
  research: { n: "02", label: "Research", dept: "Market intelligence", wait: "Waiting for a framing" },
  analyze: { n: "03", label: "Market analysis", dept: "Strategy", wait: "Waiting for research" },
  simulate: { n: "04", label: "Simulate", dept: "Customer panel", wait: "Waiting for the verdict" },
  build: { n: "05", label: "Build", dept: "Engineering", wait: "Waiting for the go" },
  market: { n: "06", label: "Market", dept: "Growth", wait: "Waiting for the build" },
};

const PLATFORM_LABEL: Record<MarketingResult["posts"][number]["platform"], string> = {
  x: "X",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

const VERDICT: Record<
  AnalysisResult["verdict"],
  { bg: string; fg: string; rule: string; line: string }
> = {
  build: {
    bg: "bg-build-bg",
    fg: "text-build",
    rule: "border-build/25",
    line: "Worth making. On to the simulation.",
  },
  iterate: {
    bg: "bg-iterate-bg",
    fg: "text-iterate",
    rule: "border-iterate/25",
    line: "The problem is real, this framing is not.",
  },
  kill: {
    bg: "bg-kill-bg",
    fg: "text-kill",
    rule: "border-kill/25",
    line: "Do not build this.",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard can be denied; the text is on screen either way.
        }
      }}
      className="label shrink-0 transition-colors duration-150 hover:text-ink"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * The research process, made visible: real web search takes seconds, so the
 * wait narrates itself as staged work instead of one spinning word.
 */
const RESEARCH_STEPS = [
  "Scanning the live market",
  "Profiling competitors",
  "Reading demand signals",
  "Mapping the gap nobody holds",
];

function ResearchProgress() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= RESEARCH_STEPS.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 5500);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <ol className="space-y-2.5">
      {RESEARCH_STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "live" : "next";
        return (
          <li key={label} className="flex items-center gap-2.5">
            {state === "done" ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-ink">
                <path d="M3.5 8.5 6.5 11.5 12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : state === "live" ? (
              <span className="animate-breathe inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-ink" />
            ) : (
              <span className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-rule-strong" />
            )}
            <span
              className={`text-[12.5px] ${
                state === "next"
                  ? "text-ink-faint"
                  : state === "live"
                    ? "text-ink"
                    : "text-ink-soft"
              }`}
            >
              {label}
              {state === "live" && "…"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Indicator({ status }: { status: StageStatus }) {
  if (status === "running") {
    return (
      <span className="animate-breathe inline-block h-[5px] w-[5px] rounded-full bg-ink" />
    );
  }
  const tone =
    status === "done"
      ? "bg-ink"
      : status === "error"
        ? "bg-kill"
        : status === "blocked"
          ? "bg-iterate"
          : "bg-rule-strong";
  return (
    <span className={`inline-block h-[5px] w-[5px] rounded-full ${tone}`} />
  );
}

function Stage({
  id,
  stages,
  onRetry,
  children,
}: {
  id: StageId;
  stages: Stages;
  onRetry: (id: StageId) => void;
  children?: React.ReactNode;
}) {
  const stage = stages[id];
  const { n, label, dept, wait } = STAGE_META[id];

  // The whole company is on the dashboard from the start: agents that have
  // not run yet sit dimmed with their department, waiting their turn.
  if (stage.status === "idle" || stage.status === "blocked") {
    return (
      <section className="bg-surface px-5 py-5 opacity-45">
        <div className="flex items-center gap-2.5">
          <Indicator status={stage.status} />
          <span className="label">{n}</span>
          <h2 className="text-[13px] font-medium tracking-tight text-ink">
            {label}
          </h2>
          <span className="label ml-auto">{dept}</span>
        </div>
        <p className="mt-3 text-[12px] text-ink-faint">
          {stage.status === "blocked" ? "Held by the verdict" : wait}
        </p>
      </section>
    );
  }

  const recoverable = stage.status === "error" || stage.status === "cancelled";

  return (
    <section className="animate-rise bg-surface px-5 py-5">
      <div className="flex items-center gap-2.5">
        <Indicator status={stage.status} />
        <span className="label">{n}</span>
        <h2 className="text-[13px] font-medium tracking-tight text-ink">
          {label}
        </h2>
        <span className="ml-auto flex items-center gap-3">
          <span className="label hidden sm:inline">{dept}</span>
          {stage.status === "running" && <span className="label">Working</span>}
          {stage.status === "cancelled" && (
            <span className="label">Cancelled</span>
          )}
          {recoverable && (
            <button
              onClick={() => onRetry(id)}
              className="label underline decoration-rule-strong underline-offset-2 transition-colors duration-150 hover:text-ink"
            >
              Retry
            </button>
          )}
        </span>
      </div>

      <div className="mt-3.5">
        {stage.status === "error" && stage.error ? (
          <p className="rounded-[6px] border border-kill/25 bg-kill-bg px-3 py-2.5 text-[12.5px] leading-relaxed text-kill">
            {stage.error}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export default function BuilderChat({
  idea,
  stages,
  brainstorm,
  chosenFraming,
  research,
  analysis,
  simulation,
  buildLog,
  marketing,
  restored,
  editing,
  revising,
  onChooseFraming,
  onRetry,
  onReconsider,
  onRefine,
  onBuildAnyway,
  onReset,
  onEdit,
  onReviseMarket,
}: {
  idea: string;
  stages: Stages;
  brainstorm: BrainstormResult | null;
  chosenFraming: Framing | null;
  research: ResearchResult | null;
  analysis: AnalysisResult | null;
  simulation: SimulationResult | null;
  buildLog: string[];
  marketing: MarketingResult | null;
  restored: boolean;
  editing: boolean;
  revising: boolean;
  onChooseFraming: (f: Framing) => void;
  onRetry: (id: StageId) => void;
  onReconsider: () => void;
  onRefine: () => void;
  onBuildAnyway: () => void;
  onReset: () => void;
  onEdit: (instruction: string) => void;
  onReviseMarket: (instruction: string) => void;
}) {
  const pickable =
    stages.brainstorm.status === "done" && stages.research.status === "idle";
  const blocked = stages.build.status === "blocked";
  const editable = stages.build.status === "done";
  const [editDraft, setEditDraft] = useState("");
  const [marketDraft, setMarketDraft] = useState("");

  const sendMarket = () => {
    const trimmed = marketDraft.trim();
    if (!trimmed || revising) return;
    onReviseMarket(trimmed);
    setMarketDraft("");
  };

  const sendEdit = () => {
    const trimmed = editDraft.trim();
    if (!trimmed || editing) return;
    onEdit(trimmed);
    setEditDraft("");
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="border-b border-rule px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="label">Idea</span>
            <p className="mt-2 text-[14px] leading-[1.5] text-ink">{idea}</p>
          </div>
          <button
            onClick={onReset}
            className="label shrink-0 transition-colors duration-150 hover:text-ink"
          >
            Reset
          </button>
        </div>
        {restored && (
          <p className="mt-3 text-[12px] text-ink-faint">
            Restored from this browser session. Retry any stage to re-run it.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px bg-rule min-[900px]:grid-cols-2">

      <Stage id="brainstorm" stages={stages} onRetry={onRetry}>
        <div className="space-y-2">
          {brainstorm?.framings.map((f, i) => {
            const chosen = chosenFraming?.angle === f.angle;
            return (
              <button
                key={i}
                disabled={!pickable}
                onClick={() => onChooseFraming(f)}
                className={`block w-full rounded-[8px] border p-3.5 text-left transition-colors duration-150 ${
                  chosen ? "border-ink bg-sunk" : "border-rule bg-surface"
                } ${pickable ? "hover:border-rule-strong" : "cursor-default"}`}
              >
                <span className="label">
                  {chosen
                    ? "Selected"
                    : i === 0
                      ? "Strongest"
                      : `Alternative ${i}`}
                </span>
                <p className="mt-2 text-[13.5px] font-medium leading-[1.45] text-ink">
                  {f.angle}
                </p>
                <dl className="mt-2.5 space-y-1.5 text-[12.5px] leading-[1.5] text-ink-soft">
                  <div>
                    <dt className="label inline">User </dt>
                    <dd className="inline">{f.targetUser}</dd>
                  </div>
                  <div>
                    <dt className="label inline">Problem </dt>
                    <dd className="inline">{f.problem}</dd>
                  </div>
                </dl>
              </button>
            );
          })}
          {pickable && (
            <>
              <button
                onClick={() => onRetry("brainstorm")}
                className="block w-full rounded-[8px] border border-dashed border-rule px-3.5 py-2.5 text-left text-[12.5px] text-ink-faint transition-colors duration-150 hover:border-rule-strong hover:text-ink-soft"
              >
                None of these — try again
              </button>
              <p className="pt-1 text-[12px] text-ink-faint">
                Choose a framing, or the strongest one proceeds on its own.
              </p>
            </>
          )}
        </div>
      </Stage>

      <Stage id="research" stages={stages} onRetry={onRetry}>
        {stages.research.status === "running" && <ResearchProgress />}
        {research && (
          <div className="space-y-5">
            {research.summary && (
              <details className="group rounded-[8px] border border-rule bg-sunk">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-[12px] font-medium text-ink-soft transition-colors duration-150 hover:text-ink [&::-webkit-details-marker]:hidden">
                  Field notes from the live web
                  <span className="label ml-2">
                    {research.searchesRun?.length
                      ? `${research.searchesRun.length} searches`
                      : "grounded"}
                  </span>
                </summary>
                <p className="whitespace-pre-wrap border-t border-rule px-3 py-2.5 text-[12px] leading-[1.6] text-ink-soft">
                  {research.summary}
                </p>
              </details>
            )}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="label">Competitors</span>
                <span className="label">{research.competitors.length}</span>
              </div>
              {research.competitors.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-ink-faint">
                  Nothing comparable surfaced.
                </p>
              ) : (
                <ul className="mt-2 space-y-px overflow-hidden rounded-[8px] border border-rule bg-rule">
                  {research.competitors.map((c, i) => (
                    <li
                      key={i}
                      className="stagger-item bg-surface px-3 py-2.5"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-medium text-ink">
                          {c.name}
                        </span>
                        {c.url && (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="label underline decoration-rule-strong underline-offset-2 transition-colors duration-150 hover:text-ink"
                          >
                            Source
                          </a>
                        )}
                      </div>
                      <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-soft">
                        {c.whatTheyDo}
                      </p>
                      <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-faint">
                        Weakness — {c.weakness}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Demand telemetry: the shape of the market, drawn. */}
            {(research.monthlyInterest?.length ||
              research.demandByRegion?.length) && (
              <div className="space-y-3">
                {research.monthlyInterest &&
                  research.monthlyInterest.length > 0 && (
                    <div className="overflow-hidden rounded-[8px] border border-rule bg-sunk">
                      <div className="flex items-baseline justify-between px-3 pt-2.5">
                        <span className="label">Interest, last 12 months</span>
                        <span className="label">estimated</span>
                      </div>
                      <div className="px-2 pb-1.5 pt-1">
                        <ChartSafe>
                          <InterestBars data={research.monthlyInterest} />
                        </ChartSafe>
                      </div>
                    </div>
                  )}
                {research.demandByRegion &&
                  research.demandByRegion.length > 0 && (
                    <div className="overflow-hidden rounded-[8px] border border-rule bg-sunk">
                      <div className="flex items-baseline justify-between px-3 pt-2.5">
                        <span className="label">Demand by geography</span>
                        <span className="label">estimated</span>
                      </div>
                      <div className="px-2 pb-1.5 pt-1">
                        <ChartSafe>
                          <DemandMap regions={research.demandByRegion} />
                        </ChartSafe>
                      </div>
                    </div>
                  )}
                {research.demandByRegion &&
                  research.demandByRegion.length > 0 &&
                  research.audienceSegments &&
                  research.audienceSegments.length > 0 && (
                    <div className="overflow-hidden rounded-[8px] border border-rule bg-sunk">
                      <div className="flex items-baseline justify-between px-3 pt-2.5">
                        <span className="label">Where demand flows</span>
                        <span className="label">
                          regions → segments · estimated
                        </span>
                      </div>
                      <div className="px-2 pb-1.5 pt-1">
                        <ChartSafe>
                          <DemandFlow
                            regions={research.demandByRegion}
                            segments={research.audienceSegments}
                          />
                        </ChartSafe>
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div>
              <div className="flex items-baseline justify-between">
                <span className="label">Demand signals</span>
                <span className="label">{research.demandSignals.length}</span>
              </div>
              {research.demandSignals.length === 0 ? (
                <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-soft">
                  None found. That counts against the idea, not for it.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {research.demandSignals.map((s, i) => (
                    <li
                      key={i}
                      className="stagger-item flex gap-2.5"
                      style={
                        {
                          "--i": research.competitors.length + i,
                        } as React.CSSProperties
                      }
                    >
                      <span className="label mt-[3px] w-14 shrink-0">
                        {s.strength}
                      </span>
                      <span className="text-[12.5px] leading-[1.5] text-ink-soft">
                        {s.signal}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {research.gaps.length > 0 && (
              <div>
                <span className="label">Gaps</span>
                <ul className="mt-2 space-y-1.5">
                  {research.gaps.map((g, i) => (
                    <li
                      key={i}
                      className="border-l border-rule-strong pl-3 text-[12.5px] leading-[1.5] text-ink-soft"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Stage>

      <Stage id="analyze" stages={stages} onRetry={onRetry}>
        {analysis && (
          <div
            className={`verdict-reveal overflow-hidden rounded-[10px] border ${VERDICT[analysis.verdict].rule} ${VERDICT[analysis.verdict].bg}`}
          >
            <div className="flex items-end justify-between px-4 pt-4">
              <div>
                <span className="label">Verdict</span>
                <p
                  className={`display mt-1 text-[2rem] ${VERDICT[analysis.verdict].fg}`}
                >
                  {analysis.verdict}
                </p>
              </div>
              <p
                className={`font-mono text-[2rem] leading-none tracking-tight ${VERDICT[analysis.verdict].fg}`}
              >
                {analysis.score}
                <span className="text-[1rem] opacity-50">/10</span>
              </p>
            </div>

            <p
              className={`px-4 pt-1 text-[12px] ${VERDICT[analysis.verdict].fg} opacity-70`}
            >
              {VERDICT[analysis.verdict].line}
            </p>

            <div className="mt-4 border-t border-white/[0.06] bg-surface/60 px-4 py-3.5">
              <p className="text-[13px] leading-[1.55] text-ink">
                {analysis.reasoning}
              </p>

              <span className="label mt-4 block">Key risks</span>
              <ul className="mt-2 space-y-1.5">
                {analysis.keyRisks.map((r, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 text-[12.5px] leading-[1.5] text-ink-soft"
                  >
                    <span className="label mt-[3px] shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {analysis?.aspects && (
          <div className="mt-4 overflow-hidden rounded-[8px] border border-rule bg-sunk pb-1">
            <div className="flex items-baseline justify-between px-3 pt-2.5">
              <span className="label">The idea, ranked</span>
              <span className="label">five axes · 0-100</span>
            </div>
            <ChartSafe>
              <AspectRadar aspects={analysis.aspects} tone={analysis.verdict} />
            </ChartSafe>
          </div>
        )}
        {analysis?.niches && analysis.niches.length > 0 && (
          <div className="mt-4">
            <NicheMap niches={analysis.niches} best={analysis.bestNiche} />
          </div>
        )}
      </Stage>

      {/* The gate. Verdict-specific next steps — never a dead end. */}
      {blocked && analysis && (
        <section className="animate-rise bg-surface px-5 py-5 min-[900px]:col-span-2">
          <span className="label">Simulate &amp; build — held</span>
          {analysis.verdict === "iterate" ? (
            <>
              <p className="mt-2.5 text-[12.5px] leading-[1.55] text-ink-soft">
                The problem is real, this framing is not. Refining feeds the
                validator&apos;s critique back into brainstorming, so the next
                framings answer what was weak.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={onRefine}
                  className="rounded-[6px] bg-ink px-3.5 py-2 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85"
                >
                  Refine idea
                </button>
                <button
                  onClick={onReconsider}
                  className="rounded-[6px] border border-rule px-3.5 py-2 text-[12.5px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
                >
                  Pick another framing
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2.5 text-[12.5px] leading-[1.55] text-ink-soft">
                The gate is the point of this tool: the useful move is a
                different idea, not a different opinion.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={onReset}
                  className="rounded-[6px] bg-ink px-3.5 py-2 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85"
                >
                  Try a different idea
                </button>
                <button
                  onClick={onReconsider}
                  className="rounded-[6px] border border-rule px-3.5 py-2 text-[12.5px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
                >
                  Pick another framing
                </button>
              </div>
            </>
          )}
          <button
            onClick={onBuildAnyway}
            className="label mt-3.5 underline decoration-rule-strong underline-offset-2 transition-colors duration-150 hover:text-ink"
          >
            Build it anyway, against the verdict
          </button>
        </section>
      )}

      <Stage id="simulate" stages={stages} onRetry={onRetry}>
        {simulation && (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="label">Synthetic panel</span>
                <span className="label">
                  {simulation.panelSize} users from the segment
                </span>
              </div>
              <div className="mt-2.5 flex gap-1">
                {Array.from({ length: simulation.panelSize }, (_, i) => (
                  <span
                    key={i}
                    className={`h-7 flex-1 rounded-[3px] ${
                      i < simulation.wouldAdopt
                        ? "bg-ink"
                        : i < simulation.wouldAdopt + simulation.unsure
                          ? "bg-rule-strong"
                          : "bg-rule"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-[12px] text-ink-soft">
                {simulation.wouldAdopt} would adopt · {simulation.unsure} unsure
                · {simulation.wouldNot} would not
              </p>
            </div>

            <div className="rounded-[8px] border border-rule bg-sunk p-3">
              <span className="label">Strongest objection</span>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink">
                {simulation.strongestObjection}
              </p>
            </div>

            {simulation.objections.length > 0 && (
              <div>
                <span className="label">Objections</span>
                <ul className="mt-2 space-y-2">
                  {simulation.objections.map((o, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="label mt-[3px] w-20 shrink-0">
                        {o.severity}
                      </span>
                      <span className="text-[12.5px] leading-[1.5] text-ink-soft">
                        {o.objection}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {simulation.adjustments.length > 0 && (
              <div>
                <span className="label">Would flip the unsure</span>
                <ul className="mt-2 space-y-1.5">
                  {simulation.adjustments.map((a, i) => (
                    <li
                      key={i}
                      className="border-l border-rule-strong pl-3 text-[12.5px] leading-[1.5] text-ink-soft"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Stage>

      <Stage id="build" stages={stages} onRetry={onRetry}>
        <ul className="space-y-1.5">
          {buildLog.map((line, i) => (
            <li
              key={i}
              className="font-mono text-[11.5px] leading-[1.5] text-ink-soft"
            >
              {line}
            </li>
          ))}
        </ul>

        {/* Talk back to Engineering: changes stream into the same files. */}
        {editable && (
          <div className="mt-4 border-t border-rule pt-4">
            <div className="flex items-stretch gap-1.5">
              <input
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendEdit();
                }}
                disabled={editing}
                placeholder='Tell Engineering: "make the header sticky"'
                className="min-w-0 flex-1 rounded-[8px] border border-rule bg-sunk px-3 py-2.5 font-sans text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-rule-strong disabled:opacity-50"
              />
              <button
                onClick={sendEdit}
                disabled={!editDraft.trim() || editing}
                className="shrink-0 rounded-[8px] bg-ink px-3.5 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
              >
                {editing ? "Working…" : "Send"}
              </button>
            </div>
            {editing && (
              <p className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-faint">
                <span className="animate-breathe inline-block h-[5px] w-[5px] rounded-full bg-ink" />
                Only the files that change will be rewritten.
              </p>
            )}
          </div>
        )}
      </Stage>

      <Stage id="market" stages={stages} onRetry={onRetry}>
        {marketing && (
          <div className="space-y-4">
            <div className="rounded-[8px] border border-rule bg-sunk p-3">
              <span className="label">Positioning</span>
              <p className="mt-1.5 text-[12.5px] leading-[1.55] text-ink">
                {marketing.positioning}
              </p>
              <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">
                Copy written to answer: {marketing.answeredObjection}
              </p>
            </div>

            <div>
              <span className="label">Drafted posts</span>
              <ul className="mt-2 space-y-2">
                {marketing.posts.map((post, i) => (
                  <li
                    key={i}
                    className="overflow-hidden rounded-[8px] border border-rule"
                  >
                    <div className="flex items-baseline justify-between gap-3 border-b border-rule bg-sunk px-3 py-2">
                      <span className="text-[12px] font-medium text-ink">
                        {PLATFORM_LABEL[post.platform]}
                        <span className="label ml-2">{post.where}</span>
                      </span>
                      <CopyButton text={post.content} />
                    </div>
                    <p className="whitespace-pre-wrap px-3 py-2.5 text-[12.5px] leading-[1.55] text-ink-soft">
                      {post.content}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="label">Where to show up first</span>
              <ul className="mt-2 space-y-1.5">
                {marketing.channels.map((c, i) => (
                  <li
                    key={i}
                    className="border-l border-rule-strong pl-3 text-[12.5px] leading-[1.5] text-ink-soft"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {/* Talk back to Growth: the copy revises in place. */}
            <div className="border-t border-rule pt-4">
              <div className="flex items-stretch gap-1.5">
                <input
                  value={marketDraft}
                  onChange={(e) => setMarketDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMarket();
                  }}
                  disabled={revising}
                  placeholder='Tell Growth: "make the X post punchier"'
                  className="min-w-0 flex-1 rounded-[8px] border border-rule bg-sunk px-3 py-2.5 font-sans text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-rule-strong disabled:opacity-50"
                />
                <button
                  onClick={sendMarket}
                  disabled={!marketDraft.trim() || revising}
                  className="shrink-0 rounded-[8px] bg-ink px-3.5 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
                >
                  {revising ? "Working…" : "Send"}
                </button>
              </div>
              {revising && (
                <p className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-faint">
                  <span className="animate-breathe inline-block h-[5px] w-[5px] rounded-full bg-ink" />
                  Revising the copy…
                </p>
              )}
            </div>
          </div>
        )}
      </Stage>

      </div>
    </div>
  );
}
