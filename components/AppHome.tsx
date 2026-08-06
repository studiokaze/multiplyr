"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import CommandPalette, { type Command } from "@/components/CommandPalette";
import type { PipelineSnapshot, StageId } from "@/lib/types";

const NAME_KEY = "multiplyer:name";
const STORAGE_PREFIX = "multiplyer:session:";

/** The placeholder types these out, holds, deletes, and moves on. */
const IDEAS = [
  "Let's build a tool that chases late invoices for freelancers",
  "Let's build an app that tracks which plants need watering",
  "Let's build AI that turns podcasts into newsletters",
  "Let's build a waitlist page that ranks signups by intent",
  "Let's build a CRM for people who hate CRMs",
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

/**
 * The composer's living placeholder: types an idea out, holds it, deletes
 * it, moves to the next. Pauses whenever the user has typed anything real.
 */
function useTypingPlaceholder(active: boolean): string {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setText(IDEAS[0]));
      return;
    }
    let i = 0;
    let pos = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const target = IDEAS[i];
      let delay = 38;
      if (!deleting) {
        pos++;
        if (pos >= target.length) {
          deleting = true;
          delay = 1800;
        }
      } else {
        pos--;
        delay = 14;
        if (pos <= 0) {
          deleting = false;
          i = (i + 1) % IDEAS.length;
          delay = 500;
        }
      }
      setText(target.slice(0, pos));
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [active]);

  return text;
}

/** "j.comtereas" or "hemant_k" -> "Hemant". First word, capitalised. */
function prettyName(raw: string): string {
  const first = raw.split(/[\s._-]+/).filter(Boolean)[0] ?? "";
  return first ? first[0].toUpperCase() + first.slice(1) : "";
}

/**
 * Claude-style, and different every visit: a counter bumps on each open, so
 * coming back never reads the same twice in a row.
 */
const LINES: { t: string; q?: boolean }[] = [
  { t: "Let's get rolling" },
  { t: "Hello again" },
  { t: "What's on the mission", q: true },
  { t: "Back at it" },
  { t: "Where were we", q: true },
  { t: "What are we making today", q: true },
  { t: "Good to see you" },
];

function greeting(name: string, visit: number): string {
  const h = new Date().getHours();
  const timeLine =
    h < 5 ? "Late one" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  const pool = [...LINES, { t: timeLine }];
  const { t, q } = pool[visit % pool.length];
  const mark = q ? "?" : ".";
  return name ? `${t}, ${name}${mark}` : `${t}${mark}`;
}

function SidebarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M6 2.5v11" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
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
  // Sidebar collapse persists like an editor's does. Starts expanded on the
  // server render; the saved preference lands right after hydration.
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("multiplyer:sidebar", c ? "open" : "collapsed");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const mounted = useMounted();
  const recent = mounted ? readRecent() : [];
  const shown = query
    ? recent.filter((r) => r.idea.toLowerCase().includes(query.toLowerCase()))
    : recent;
  const [askName, setAskName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [visit, setVisit] = useState(0);
  const placeholder = useTypingPlaceholder(mounted && idea.length === 0);

  useEffect(() => {
    try {
      if (localStorage.getItem("multiplyer:sidebar") === "collapsed") {
        queueMicrotask(() => setCollapsed(true));
      }
    } catch {
      /* ignore */
    }
    // Visit counter drives the greeting rotation — new line every open.
    try {
      const n = Number(localStorage.getItem("multiplyer:visits") ?? "0") + 1;
      localStorage.setItem("multiplyer:visits", String(n));
      queueMicrotask(() => setVisit(n));
    } catch {
      /* ignore */
    }
    // Claude-style: never seen before -> ask once; the OS account name only
    // prefills the ask, it never becomes the name on its own.
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(NAME_KEY);
    } catch {
      /* ignore */
    }
    if (saved !== null) {
      if (saved) queueMicrotask(() => setName(saved));
      return;
    }
    queueMicrotask(() => setAskName(true));
    const bridge = (window as { multiplyer?: DesktopBridge }).multiplyer;
    bridge
      ?.userName?.()
      .then((raw) => setNameDraft(prettyName(raw)))
      .catch(() => {});
  }, []);

  const saveName = (value: string) => {
    const clean = value.trim();
    try {
      localStorage.setItem(NAME_KEY, clean);
    } catch {
      /* ignore */
    }
    setName(clean);
    setAskName(false);
  };

  const start = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) router.push(`/builder?idea=${encodeURIComponent(trimmed)}`);
  };

  const commands: Command[] = [
    {
      label: "New idea",
      hint: "compose",
      run: () => {
        setIdea("");
        document.querySelector("textarea")?.focus();
      },
    },
    { label: collapsed ? "Expand sidebar" : "Collapse sidebar", hint: "view", run: toggleSidebar },
    ...recent.slice(0, 6).map((r) => ({
      label: `Open: ${r.idea}`,
      hint: r.verdict ?? "run",
      run: () => start(r.idea),
    })),
  ];

  return (
    <main className="app-shell flex bg-paper">
      <CommandPalette commands={commands} />
      {/* First run: what should we call you? Saved locally, asked once. */}
      {askName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveName(nameDraft);
            }}
            className="w-full max-w-[22rem] rounded-[14px] border border-rule-strong bg-surface p-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.9)]"
          >
            <h2 className="text-[16px] font-medium text-ink">
              What should we call you?
            </h2>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Your name"
              autoFocus
              autoComplete="off"
              className="mt-4 w-full rounded-[8px] border border-rule bg-sunk px-3.5 py-2.5 font-sans text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-rule-strong"
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => saveName("")}
                className="label transition-colors duration-150 hover:text-ink"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={!nameDraft.trim()}
                className="rounded-[8px] bg-ink px-4 py-2 text-[12.5px] font-medium text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ---- sidebar (collapses to a rail, preference persists) ---- */}
      {collapsed ? (
        <aside className="flex w-[52px] shrink-0 flex-col items-center border-r border-rule bg-surface py-4">
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="rounded-[7px] border border-rule bg-sunk p-2 text-ink transition-colors duration-150 hover:border-rule-strong"
          >
            <SidebarIcon />
          </button>
          <button
            onClick={() => {
              setIdea("");
              setQuery("");
            }}
            title="New run"
            aria-label="New run"
            className="mt-1 rounded-[6px] p-2 text-[15px] leading-none text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
          >
            +
          </button>
          <span className="mt-auto flex h-[26px] w-[26px] items-center justify-center rounded-full bg-ink text-[11px] font-medium text-paper">
            {name ? name[0] : "•"}
          </span>
        </aside>
      ) : (
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-rule bg-surface pt-3">
        <div className="mx-3 flex items-center gap-1.5">
          <button
            onClick={() => {
              setIdea("");
              setQuery("");
            }}
            className="flex flex-1 items-center gap-2 rounded-[7px] px-3 py-2 text-left text-[12.5px] font-medium text-ink transition-colors duration-150 hover:bg-sunk"
          >
            <span className="text-[14px] leading-none">+</span> New run
          </button>
          <button
            onClick={toggleSidebar}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="shrink-0 rounded-[7px] border border-rule bg-sunk p-2 text-ink transition-colors duration-150 hover:border-rule-strong"
          >
            <SidebarIcon />
          </button>
        </div>

        <div className="mt-1 px-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-[7px] border border-transparent bg-transparent px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-ink-soft focus:border-rule focus:bg-sunk"
          />
        </div>

        <button
          disabled
          className="mx-3 flex cursor-default items-center justify-between rounded-[7px] px-3 py-2 text-left text-[12.5px] text-ink-soft"
        >
          Automations
          <span className="label">soon</span>
        </button>
        <button
          disabled
          className="mx-3 flex cursor-default items-center justify-between rounded-[7px] px-3 py-2 text-left text-[12.5px] text-ink-soft"
        >
          Customize
          <span className="label">soon</span>
        </button>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {shown.length > 0 && (
            <span className="label px-3">{query ? "Matches" : "Runs"}</span>
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
          <button
            disabled
            title="Settings — soon"
            aria-label="Settings"
            className="flex cursor-default items-center gap-2.5 rounded-[7px] px-3 py-2 text-[12px] text-ink-soft"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            Settings
          </button>
          <a
            href="https://multiplyer.vercel.app/#pricing"
            target="_blank"
            rel="noreferrer"
            className="block rounded-[7px] px-3 py-2 text-[12px] font-medium text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
          >
            Upgrade to a Pro account
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
      )}

      {/* ---- composer ---- */}
      <section className="flex min-w-0 flex-1 items-center justify-center px-8">
        <div className="w-full max-w-[40rem] pb-16">
          <h1 className="display text-center text-[1.9rem] text-ink">
            {mounted ? greeting(name, visit) : " "}
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
                placeholder={placeholder}
                rows={3}
                autoFocus
                className="w-full resize-none bg-transparent px-4 pt-3.5 font-sans text-[14.5px] leading-[1.55] text-ink outline-none placeholder:text-ink-faint"
              />
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="flex cursor-default items-center gap-1 rounded-[6px] border border-rule px-2 py-1 text-[11px] text-ink-soft">
                    No project <span className="text-[8px]">▾</span>
                  </span>
                  <span className="flex cursor-default items-center gap-1.5 rounded-[6px] border border-rule px-2 py-1 text-[11px] text-ink-soft">
                    This PC
                  </span>
                  <span className="flex cursor-default items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] text-ink-faint">
                    + Auto
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!idea.trim()}
                  aria-label="Run the pipeline"
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ink text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M8 12.5v-9m0 0-3.5 3.5M8 3.5l3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {/* quick actions, as in the reference */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                // With an idea typed, this IS the start button: brainstorm
                // fires and the pipeline carries on from there by itself.
                if (idea.trim()) start(idea);
                else document.querySelector("textarea")?.focus();
              }}
              className="flex items-center gap-1.5 rounded-[7px] border border-rule px-2.5 py-1.5 text-[11px] text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
            >
              <span aria-hidden="true" className="text-[9px]">
                ▶
              </span>
              Plan New Idea
            </button>
            <span className="flex cursor-default items-center gap-1.5 rounded-[7px] border border-rule px-2.5 py-1.5 text-[11px] text-ink-soft">
              <kbd className="rounded-[4px] border border-rule bg-sunk px-1.5 py-0.5 font-mono text-[9.5px] text-ink-faint">
                Tab
              </kbd>
              Multitask
            </span>
          </div>

          <p className="mt-10 text-center text-[11.5px] text-ink-faint">
            Every idea runs all six agents — nothing gets built until the
            verdict says so.
          </p>
        </div>
      </section>
    </main>
  );
}
