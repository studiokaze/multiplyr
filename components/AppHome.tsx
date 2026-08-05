"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { PipelineSnapshot, StageId } from "@/lib/types";

const NAME_KEY = "multiplyer:name";

type DesktopBridge = { userName?: () => Promise<string> };

/** "j.comtereas" or "hemant_k" -> "Hemant". First word, capitalised. */
function prettyName(raw: string): string {
  const first = raw.split(/[\s._-]+/).filter(Boolean)[0] ?? "";
  return first ? first[0].toUpperCase() + first.slice(1) : "";
}

/**
 * Claude-style greeting: rotates daily between action lines and a
 * time-of-day line, so the app says hello differently through the week
 * without ever being random within a session.
 */
function greeting(name: string): string {
  const d = new Date();
  const h = d.getHours();
  const timeLine =
    h < 5 ? "Late one" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  const lines = ["Let's get rolling", "Back at it", timeLine, "Where were we"];
  const day = Math.floor(d.getTime() / 86400000);
  const line = lines[day % lines.length];
  return name ? `${line}, ${name}.` : `${line}.`;
}

const EXAMPLES = [
  "a tool that helps freelancers chase late invoices",
  "an app that tracks which plants in my garden need watering",
  "AI that turns podcast episodes into newsletters",
];

const STORAGE_PREFIX = "multiplyer:session:";

const ORDER: StageId[] = [
  "brainstorm",
  "research",
  "analyze",
  "simulate",
  "build",
  "market",
];

type Recent = {
  idea: string;
  reached: string;
  verdict: string | null;
  files: number;
};

/**
 * Mount flag via useSyncExternalStore: sessionStorage does not exist during
 * the prerender, and reading it in an effect would both flash and trip the
 * cascading-render rule. Server snapshot false, client snapshot true.
 */
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
    // localStorage to match the pipeline's persistence: past runs are a
    // record of spent model usage, not a per-tab convenience.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const snap = JSON.parse(raw) as PipelineSnapshot;
      if (!snap?.idea || !snap.stages) continue;
      // Furthest stage that actually completed.
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

const STAGE_LABEL: Record<string, string> = {
  brainstorm: "Brainstorm",
  research: "Research",
  analyze: "Market analysis",
  simulate: "Simulate",
  build: "Build",
  market: "Market",
};

/**
 * The desktop app's entry screen. Deliberately not the marketing page: someone
 * who has already installed the app does not need to be sold it.
 */
export default function AppHome() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [name, setName] = useState("");
  const mounted = useMounted();
  const recent = mounted ? readRecent() : [];

  // A saved name wins; otherwise the desktop bridge offers the OS account
  // name. On the plain web with neither, the greeting just drops the name.
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
    <main className="flex flex-1 flex-col items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[38rem]">
        <h1 className="display text-center text-[2rem] text-ink">
          {/* Held to a fixed height pre-mount so the layout never jumps. */}
          {mounted ? greeting(name) : " "}
        </h1>
        <p className="mt-2.5 text-center text-[13.5px] leading-[1.6] text-ink-soft">
          What are we validating? One line is enough — nothing gets built
          until the earlier stages have earned it.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(idea);
          }}
          className="mt-7"
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-[10px] border border-rule-strong bg-surface sm:flex-row sm:items-stretch">
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="a tool that…"
              autoFocus
              autoComplete="off"
              className="flex-1 bg-transparent px-4 py-4 text-[15px] text-ink outline-none placeholder:text-ink-faint focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!idea.trim()}
              className="m-1.5 shrink-0 rounded-[6px] bg-ink px-6 py-3 text-[13px] font-medium text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
            >
              Run the pipeline
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="label mr-1">Try</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => setIdea(example)}
              className="rounded-full border border-rule bg-surface px-3 py-1.5 text-[12.5px] text-ink-soft transition-colors duration-150 hover:border-rule-strong hover:text-ink"
            >
              {example}
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-12">
            <span className="label">Past runs</span>
            <ul className="mt-3 space-y-px overflow-hidden rounded-[10px] border border-rule bg-rule">
              {recent.map((r) => (
                <li key={r.idea}>
                  <button
                    onClick={() => start(r.idea)}
                    className="flex w-full items-center justify-between gap-4 bg-surface px-4 py-3 text-left transition-colors duration-150 hover:bg-sunk"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-ink">
                        {r.idea}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-faint">
                        Reached {STAGE_LABEL[r.reached]}
                        {r.files > 0 && ` · ${r.files} files`}
                      </span>
                    </span>
                    {r.verdict && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.09em] ${
                          r.verdict === "build"
                            ? "bg-build-bg text-build"
                            : r.verdict === "iterate"
                              ? "bg-iterate-bg text-iterate"
                              : "bg-kill-bg text-kill"
                        }`}
                      >
                        {r.verdict}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
