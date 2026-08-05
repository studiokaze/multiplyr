"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { MarkGlyph } from "@/components/marketing/Mark";
import type { PipelineSnapshot, StageId } from "@/lib/types";

const NAME_KEY = "multiplyer:name";
const STORAGE_PREFIX = "multiplyer:session:";

const EXAMPLES = [
  "a tool that helps freelancers chase late invoices",
  "an app that tracks which plants need watering",
  "AI that turns podcast episodes into newsletters",
];

const TIPS = [
  "Runs survive restarts — close the app mid-run and pick it up later.",
  "Export a brief from any finished run and hand it to a cofounder.",
  "Nothing gets built until the earlier stages have earned it.",
  "Stage 06 drafts launch posts aimed at the segment that validated.",
];

const ORDER: StageId[] = [
  "brainstorm",
  "research",
  "analyze",
  "simulate",
  "build",
  "market",
];

const STAGE_LABEL: Record<string, string> = {
  brainstorm: "Brainstorm",
  research: "Research",
  analyze: "Market analysis",
  simulate: "Simulate",
  build: "Build",
  market: "Market",
};

type Recent = {
  idea: string;
  reached: string;
  verdict: string | null;
  files: number;
};

type DesktopBridge = { userName?: () => Promise<string> };

const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

function readRecent(): Recent[] {
  if (typeof window === "undefined") return [];
  const out: Recent[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const snap = JSON.parse(raw) as PipelineSnapshot;
      if (!snap?.idea || !snap.stages) continue;
      const reached =
        [...ORDER].reverse().find((s) => snap.stages[s]?.status === "done") ??
        "brainstorm";
      out.push({
        idea: snap.idea,
        reached,
        verdict: snap.analysis?.verdict ?? null,
        files: snap.files?.length ?? 0,
      });
    }
  } catch {
    return [];
  }
  return out;
}

/** "j.comtereas" or "hemant_k" -> "Hemant". First word, capitalised. */
function prettyName(raw: string): string {
  const first = raw.split(/[\s._-]+/).filter(Boolean)[0] ?? "";
  return first ? first[0].toUpperCase() + first.slice(1) : "";
}

/** Claude-style: rotates daily between action lines and a time line. */
function greeting(name: string): string {
  const d = new Date();
  const h = d.getHours();
  const timeLine =
    h < 5 ? "Late one" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  const lines = ["Let's get rolling", "Back at it", timeLine, "Where were we"];
  const line = lines[Math.floor(d.getTime() / 86400000) % lines.length];
  return name ? `${line}, ${name}.` : `${line}.`;
}

function VerdictDot({ verdict }: { verdict: string | null }) {
  const tone =
    verdict === "build"
      ? "bg-build"
      : verdict === "iterate"
        ? "bg-iterate"
        : verdict === "kill"
          ? "bg-kill"
          : "bg-rule-strong";
  return <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${tone}`} />;
}

/**
 * The app's entry: a sidebar that holds the account of past work, and a
 * centered composer that starts new work — the Cursor-home shape, in the
 * app's own light language.
 */
export default function AppHome() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const mounted = useMounted();
  const recent = mounted ? readRecent() : [];
  const shown = query
    ? recent.filter((r) => r.idea.toLowerCase().includes(query.toLowerCase()))
    : recent;
  const tip = mounted
    ? TIPS[Math.floor(Date.now() / 86400000) % TIPS.length]
    : TIPS[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      if (saved) {
        setName(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    const bridge = (window as { multiplyer?: DesktopBridge }).multiplyer;
    bridge
      ?.userName?.()
      .then((raw) => setName(prettyName(raw)))
      .catch(() => {});
  }, []);

  const start = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) router.push(`/builder?idea=${encodeURIComponent(trimmed)}`);
  };

  return (
    <main className="flex h-dvh bg-paper">
      {/* ---- sidebar ---- */}
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-rule bg-surface">
        <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
          <MarkGlyph size={18} className="text-ink" />
          <span className="brand text-[10px] text-ink">Multiplyer</span>
        </div>

        <div className="px-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search runs"
            className="w-full rounded-[7px] border border-rule bg-sunk px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-ink-faint focus:border-rule-strong"
          />
        </div>

        <button
          onClick={() => {
            setIdea("");
            setQuery("");
          }}
          className="mx-3 mt-2 flex items-center gap-2 rounded-[7px] px-3 py-2 text-left text-[12.5px] font-medium text-ink transition-colors duration-150 hover:bg-sunk"
        >
          <span className="text-[14px] leading-none">+</span> New run
        </button>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {shown.length > 0 && (
            <span className="label px-3">
              {query ? "Matches" : "Past runs"}
            </span>
          )}
          <ul className="mt-1.5 space-y-0.5">
            {shown.map((r) => (
              <li key={r.idea}>
                <button
                  onClick={() => start(r.idea)}
                  title={r.idea}
                  className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left transition-colors duration-150 hover:bg-sunk"
                >
                  <VerdictDot verdict={r.verdict} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-ink">
                      {r.idea}
                    </span>
                    <span className="block truncate text-[10.5px] text-ink-faint">
                      {STAGE_LABEL[r.reached]}
                      {r.files > 0 && ` · ${r.files} files`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {mounted && recent.length === 0 && (
            <p className="px-3 pt-1 text-[11.5px] leading-[1.5] text-ink-faint">
              Runs land here as you go.
            </p>
          )}
        </div>

        <div className="border-t border-rule p-3">
          <a
            href="https://multiplyer.vercel.app/#pricing"
            target="_blank"
            rel="noreferrer"
            className="block rounded-[7px] px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
          >
            Upgrade to Pro
          </a>
          <div className="mt-1 flex items-center gap-2.5 px-3 py-2">
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-paper">
              {name ? name[0] : "•"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-medium text-ink">
                {name || "You"}
              </span>
              <span className="block text-[10.5px] text-ink-faint">
                Free plan
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* ---- composer ---- */}
      <section className="flex min-w-0 flex-1 items-center justify-center px-8">
        <div className="w-full max-w-[40rem] pb-16">
          <h1 className="display text-center text-[1.9rem] text-ink">
            {mounted ? greeting(name) : " "}
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              start(idea);
            }}
            className="mt-8"
          >
            <div className="overflow-hidden rounded-[14px] border border-rule-strong bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_48px_-24px_rgba(0,0,0,0.9)] transition-colors duration-200 focus-within:border-white/30">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    start(idea);
                  }
                }}
                placeholder="Describe the app. One line is enough."
                rows={3}
                autoFocus
                className="w-full resize-none bg-transparent px-4 pt-3.5 text-[14.5px] leading-[1.55] text-ink outline-none placeholder:text-ink-faint"
              />
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <span className="rounded-[6px] border border-rule px-2 py-1 font-mono text-[10px] text-ink-faint">
                  claude-sonnet-4-6
                </span>
                <button
                  type="submit"
                  disabled={!idea.trim()}
                  className="rounded-[8px] bg-ink px-4 py-2 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
                >
                  Run the pipeline ↵
                </button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => setIdea(example)}
                className="rounded-full border border-rule bg-surface px-3 py-1.5 text-[12px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
              >
                {example}
              </button>
            ))}
          </div>

          <p className="mt-10 text-center text-[11.5px] text-ink-faint">
            {tip}
          </p>
        </div>
      </section>
    </main>
  );
}
