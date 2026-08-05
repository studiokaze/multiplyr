"use client";

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

const STAGE_META: Record<StageId, { n: string; label: string }> = {
  brainstorm: { n: "01", label: "Brainstorm" },
  research: { n: "02", label: "Research" },
  analyze: { n: "03", label: "Market analysis" },
  simulate: { n: "04", label: "Simulate" },
  build: { n: "05", label: "Build" },
  market: { n: "06", label: "Market" },
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
  // "blocked" is rendered by the dedicated gate section, not as a stage row.
  if (stage.status === "idle" || stage.status === "blocked") return null;
  const { n, label } = STAGE_META[id];
  const recoverable = stage.status === "error" || stage.status === "cancelled";

  return (
    <section className="animate-rise border-b border-rule px-5 py-5">
      <div className="flex items-center gap-2.5">
        <Indicator status={stage.status} />
        <span className="label">{n}</span>
        <h2 className="text-[13px] font-medium tracking-tight text-ink">
          {label}
        </h2>
        <span className="ml-auto flex items-center gap-3">
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
  onChooseFraming,
  onRetry,
  onReconsider,
  onBuildAnyway,
  onReset,
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
  onChooseFraming: (f: Framing) => void;
  onRetry: (id: StageId) => void;
  onReconsider: () => void;
  onBuildAnyway: () => void;
  onReset: () => void;
}) {
  const pickable =
    stages.brainstorm.status === "done" && stages.research.status === "idle";
  const blocked = stages.build.status === "blocked";

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
            <p className="pt-1 text-[12px] text-ink-faint">
              Choose a framing, or the strongest one proceeds on its own.
            </p>
          )}
        </div>
      </Stage>

      <Stage id="research" stages={stages} onRetry={onRetry}>
        {research && (
          <div className="space-y-5">
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
                    <li key={i} className="bg-surface px-3 py-2.5">
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
                    <li key={i} className="flex gap-2.5">
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
            className={`animate-rise overflow-hidden rounded-[10px] border ${VERDICT[analysis.verdict].rule} ${VERDICT[analysis.verdict].bg}`}
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

            <div className="mt-4 border-t border-black/[0.06] bg-surface/60 px-4 py-3.5">
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
        {analysis?.niches && analysis.niches.length > 0 && (
          <div className="mt-4">
            <NicheMap niches={analysis.niches} best={analysis.bestNiche} />
          </div>
        )}
      </Stage>

      {/* The gate. Reachable next steps, so a non-build verdict is not a dead end. */}
      {blocked && analysis && (
        <section className="animate-rise border-b border-rule px-5 py-5">
          <span className="label">Simulate &amp; build — held</span>
          <p className="mt-2.5 text-[12.5px] leading-[1.55] text-ink-soft">
            The simulation and the builder only run on a build verdict. That
            gate is the point of this tool, so the useful move is a different
            framing — not a different opinion.
          </p>
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <button
              onClick={onReconsider}
              className="rounded-[6px] bg-ink px-3.5 py-2 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85"
            >
              Try another framing
            </button>
            <button
              onClick={onReset}
              className="rounded-[6px] border border-rule px-3.5 py-2 text-[12.5px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
            >
              New idea
            </button>
          </div>
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
                    <div className="flex items-baseline justify-between border-b border-rule bg-sunk px-3 py-2">
                      <span className="text-[12px] font-medium text-ink">
                        {PLATFORM_LABEL[post.platform]}
                      </span>
                      <span className="label">{post.where}</span>
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
          </div>
        )}
      </Stage>
    </div>
  );
}
