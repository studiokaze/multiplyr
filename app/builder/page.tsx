"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BuilderChat from "@/components/BuilderChat";
import CommandPalette, { type Command } from "@/components/CommandPalette";
import FileTree from "@/components/FileTree";
import PreviewPane from "@/components/PreviewPane";
import { usePipeline } from "@/hooks/usePipeline";
import { briefFilename, buildBrief } from "@/lib/brief";
import { encodeShare } from "@/lib/share";
import type { StageId } from "@/lib/types";

const ORDER: StageId[] = [
  "market",
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
  market: "Market",
};

type View = "preview" | "code";

function Workspace() {
  const router = useRouter();
  const idea = useSearchParams().get("idea")?.trim() ?? "";
  const p = usePipeline(idea);
  const [view, setView] = useState<View>("preview");
  const [shared, setShared] = useState(false);
  // The demo pane stays out of the way until there is a demo: research and
  // the verdict get the full page. First file auto-opens it; the header
  // toggle rules after that.
  const [demoOpen, setDemoOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const notified = useRef(false);
  const filesArrived = p.files.length > 0;
  useEffect(() => {
    if (filesArrived) queueMicrotask(() => setDemoOpen(true));
  }, [filesArrived]);

  // All six agents done: tell the user once, in-app and via the OS.
  const allDone = p.stages.market.status === "done";
  useEffect(() => {
    if (!allDone || notified.current) return;
    notified.current = true;
    queueMicrotask(() =>
      setToast("Your company is built — all six agents are done."),
    );
    const t = setTimeout(() => setToast(null), 8000);
    try {
      const fire = () =>
        new Notification("Multiplyer", {
          body: "Run complete: validated, built, and ready to market.",
        });
      if (Notification.permission === "granted") fire();
      else if (Notification.permission !== "denied")
        void Notification.requestPermission().then(
          (perm) => perm === "granted" && fire(),
        );
    } catch {
      /* notifications unsupported — the toast carries it */
    }
    return () => clearTimeout(t);
  }, [allDone]);

  /**
   * Bare deploy: the whole build travels in the link's fragment, and the
   * /share page on the public site rebuilds it. Copy + open — that's it.
   */
  const shareBuild = () => {
    const url = `https://multiplyer.vercel.app/share#${encodeShare(idea, p.files)}`;
    void navigator.clipboard?.writeText(url).catch(() => {});
    window.open(url, "_blank", "noopener");
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

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
  const done = p.stages.market.status === "done";

  const reset = () => {
    p.clearSession();
    router.push("/app");
  };

  // Back is not reset: the run stays saved and listed on the dashboard.
  const goHome = () => router.push("/app");

  const exportBrief = () => {
    const markdown = buildBrief({
      idea,
      framing: p.chosenFraming,
      research: p.research,
      analysis: p.analysis,
      simulation: p.simulation,
      files: p.files,
      marketing: p.marketing,
    });
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = briefFilename(idea);
    a.click();
    URL.revokeObjectURL(url);
  };

  const commands: Command[] = [
    { label: "Back to dashboard", hint: "keeps run", run: goHome },
    { label: "New idea", hint: "clears run", run: reset },
    {
      label: view === "preview" ? "Show code" : "Show preview",
      hint: "view",
      run: () => setView(view === "preview" ? "code" : "preview"),
    },
    {
      label: demoOpen ? "Hide demo pane" : "Show demo pane",
      hint: "layout",
      run: () => setDemoOpen(!demoOpen),
    },
    ...(p.busy
      ? [{ label: "Cancel run", hint: "stop", run: p.cancel }]
      : []),
    ...(p.analysis && !p.busy
      ? [{ label: "Export brief", hint: ".md", run: exportBrief }]
      : []),
    ...(p.files.length > 0 && !p.busy
      ? [{ label: "Share build", hint: "link", run: shareBuild }]
      : []),
  ];

  return (
    <main className="app-shell flex flex-col">
      <CommandPalette commands={commands} />
      {toast && (
        <div className="verdict-reveal fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-[12px] border border-build/30 bg-build-bg px-4 py-3 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.8)]">
          <span className="h-[8px] w-[8px] rounded-full bg-build" />
          <span className="text-[13px] font-medium text-ink">{toast}</span>
        </div>
      )}
      <header className="flex h-[46px] shrink-0 items-center justify-between gap-4 border-b border-rule bg-surface px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={goHome}
            title="Back to dashboard"
            aria-label="Back to dashboard"
            className="shrink-0 rounded-[6px] border border-rule p-1.5 text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10.5 3 5.5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={goHome}
            className="brand shrink-0 text-[10.5px] text-ink"
          >
            Multiplyer
          </button>
          <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-rule" />
          <span className="truncate text-[12.5px] text-ink-soft">{idea}</span>
        </div>

        {/* view switch, top centre — the pattern every builder uses */}
        <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => setDemoOpen((o) => !o)}
          aria-pressed={demoOpen}
          className="rounded-[7px] border border-rule px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
        >
          {demoOpen ? "Hide demo" : "Show demo"}
        </button>
        <div className="flex shrink-0 items-center gap-0.5 rounded-[7px] bg-sunk p-0.5">
          {(["preview", "code"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-[5px] px-3 py-1.5 text-[12px] font-medium capitalize transition-colors duration-150 ${
                view === v
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
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
          {p.files.length > 0 && !p.busy && (
            <button
              onClick={shareBuild}
              className="rounded-[6px] bg-ink px-2.5 py-1.5 text-[12px] font-medium text-paper transition-opacity duration-150 hover:opacity-85"
            >
              {shared ? "Link copied ✓" : "Share"}
            </button>
          )}
          {p.analysis && !p.busy && (
            <button
              onClick={exportBrief}
              className="rounded-[6px] border border-rule px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
            >
              Export brief
            </button>
          )}
          <button
            onClick={reset}
            className="rounded-[6px] border border-rule px-2.5 py-1.5 text-[12px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
          >
            New run
          </button>
        </div>
      </header>

      <div
        className={
          demoOpen
            ? "grid min-h-0 flex-1 grid-cols-1 gap-px bg-rule lg:grid-cols-[minmax(380px,420px)_minmax(0,1fr)]"
            : "flex min-h-0 flex-1 bg-paper"
        }
      >
        <div
          className={
            demoOpen
              ? "min-h-0 overflow-hidden"
              : "min-h-0 w-full overflow-hidden"
          }
        >
          <BuilderChat
            idea={idea}
            stages={p.stages}
            brainstorm={p.brainstorm}
            chosenFraming={p.chosenFraming}
            research={p.research}
            analysis={p.analysis}
            simulation={p.simulation}
            buildLog={p.buildLog}
            marketing={p.marketing}
            restored={p.restored}
            editing={p.editing}
            onEdit={p.runEdit}
            revising={p.revising}
            onReviseMarket={p.runMarketRevise}
            onChooseFraming={p.chooseFraming}
            onRetry={p.retry}
            onReconsider={p.reconsider}
            onRefine={p.refine}
            onBuildAnyway={p.buildAnyway}
            onReset={reset}
          />
        </div>

        {demoOpen && (
          <div className="min-h-0 overflow-hidden">
            {view === "preview" ? (
              <PreviewPane files={p.files} />
            ) : (
              <FileTree files={p.files} />
            )}
          </div>
        )}
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
