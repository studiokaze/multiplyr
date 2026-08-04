"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BuilderChat from "@/components/BuilderChat";
import FileTree from "@/components/FileTree";
import PreviewPane from "@/components/PreviewPane";
import { usePipeline } from "@/hooks/usePipeline";
import type { StageId } from "@/lib/types";

const ORDER: StageId[] = [
  "build",
  "simulate",
  "analyze",
  "research",
  "brainstorm",
];

const STAGE_LABEL: Record<StageId, string> = {
  brainstorm: "Brainstorm",
  research: "Research",
  analyze: "Market analysis",
  simulate: "Simulate",
  build: "Build",
};

type View = "preview" | "code";

function Workspace() {
  const router = useRouter();
  const idea = useSearchParams().get("idea")?.trim() ?? "";
  const p = usePipeline(idea);
  const [view, setView] = useState<View>("preview");

  if (!idea) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-[13.5px] text-ink-soft">No idea supplied.</p>
          <button
            onClick={() => router.push("/app")}
            className="mt-4 rounded-[6px] bg-ink px-4 py-2.5 text-[13px] font-medium text-paper transition-opacity duration-150 hover:opacity-85"
          >
            Start over
          </button>
        </div>
      </main>
    );
  }

  const running = ORDER.find((id) => p.stages[id].status === "running");
  const done = p.stages.build.status === "done";

  const reset = () => {
    p.clearSession();
    router.push("/app");
  };

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex h-[46px] shrink-0 items-center justify-between gap-4 border-b border-rule bg-surface px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={reset}
            className="shrink-0 text-[13px] font-medium tracking-tight text-ink"
          >
            Multiplyr
          </button>
          <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-rule" />
          <span className="truncate text-[12.5px] text-ink-soft">{idea}</span>
        </div>

        {/* view switch, top centre — the pattern every builder uses */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-[7px] bg-sunk p-0.5">
          {(["preview", "code"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-[5px] px-3 py-1.5 text-[12px] font-medium capitalize transition-colors duration-150 ${
                view === v
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {v}
              {v === "code" && p.files.length > 0 && (
                <span className="ml-1.5 font-mono text-[10px] text-ink-faint">
                  {p.files.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {p.busy ? (
            <>
              <span className="flex items-center gap-2 text-[12px] text-ink-soft">
                <span className="animate-breathe inline-block h-[5px] w-[5px] rounded-full bg-ink" />
                {running ? STAGE_LABEL[running] : "Working"}
              </span>
              <button
                onClick={p.cancel}
                className="label transition-colors duration-150 hover:text-ink"
              >
                Cancel
              </button>
            </>
          ) : (
            <span className="label">
              {done
                ? "Complete"
                : p.analysis
                  ? `Verdict · ${p.analysis.verdict}`
                  : "Idle"}
            </span>
          )}
          <button
            onClick={reset}
            className="rounded-[6px] border border-rule px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
          >
            New run
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-rule lg:grid-cols-[minmax(380px,420px)_minmax(0,1fr)]">
        <div className="min-h-0 overflow-hidden">
          <BuilderChat
            idea={idea}
            stages={p.stages}
            brainstorm={p.brainstorm}
            chosenFraming={p.chosenFraming}
            research={p.research}
            analysis={p.analysis}
            simulation={p.simulation}
            buildLog={p.buildLog}
            restored={p.restored}
            onChooseFraming={p.chooseFraming}
            onRetry={p.retry}
            onReconsider={p.reconsider}
            onBuildAnyway={p.buildAnyway}
            onReset={reset}
          />
        </div>

        <div className="min-h-0 overflow-hidden">
          {view === "preview" ? (
            <PreviewPane files={p.files} />
          ) : (
            <FileTree files={p.files} />
          )}
        </div>
      </div>
    </main>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center">
          <span className="label">Loading workspace</span>
        </main>
      }
    >
      <Workspace />
    </Suspense>
  );
}
