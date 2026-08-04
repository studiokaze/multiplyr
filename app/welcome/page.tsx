"use client";

import { useEffect, useState } from "react";

/**
 * Desktop-only onboarding. The Electron main process loads this route on
 * first run (and from the menu later); the preload bridge does the sensitive
 * work — the key is validated against Anthropic in the MAIN process and never
 * touches this renderer beyond the input field.
 *
 * A web visitor who lands here has no bridge and is sent home.
 */

type Bridge = {
  getKeyHint: () => Promise<string>;
  saveKey: (key: string) => Promise<{ ok: boolean; error?: string }>;
  skip: () => Promise<void>;
  platform: string;
};

declare global {
  interface Window {
    multiplyr?: Bridge;
  }
}

const STAGES = [
  ["01", "Brainstorm", "your line becomes 2-3 sharp framings"],
  ["02", "Research", "live web search for rivals and demand"],
  ["03", "Market analysis", "an honest build / iterate / kill verdict"],
  ["04", "Simulate", "12 synthetic users meet it before anyone real"],
  ["05", "Build", "a working demo from whatever survived"],
] as const;

export default function Welcome() {
  const [bridge, setBridge] = useState<Bridge | null>(null);
  const [hint, setHint] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const b = window.multiplyr;
    if (!b) {
      // Not the desktop shell — this page has nothing for the web.
      window.location.replace("/");
      return;
    }
    // Probing for the preload bridge is inherently an on-mount effect (the
    // bridge only exists on window, after hydration), and the hint arrives
    // from async IPC — the same fetch-on-mount shape this rule cannot tell
    // apart from a render loop. Runs exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBridge(b);
    b.getKeyHint().then(setHint);
  }, []);

  if (!bridge) return null;

  const menuName =
    bridge.platform === "darwin" ? "the Multiplyr menu" : "the File menu";

  const submit = async () => {
    const trimmed = key.trim();
    if (trimmed.length < 8 || busy) return;
    setBusy(true);
    setError(null);
    const result = await bridge.saveKey(trimmed);
    // On success the main process restarts the server and navigates away;
    // this state only matters on failure.
    if (!result.ok) {
      setError(result.error ?? "That key did not work.");
      setBusy(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-[30rem]">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2.5 3.5L6.5 8L2.5 12.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink"
            />
            <path
              d="M8.5 12.5H13.5"
              stroke="#e9b44c"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[14px] font-medium tracking-tight text-ink">
            Multiplyr
          </span>
        </div>

        <h1 className="display mt-6 text-[1.75rem] text-ink">
          Five agents. One run.
        </h1>
        <p className="mt-2.5 text-[13.5px] leading-[1.6] text-ink-soft">
          Every idea you type goes through the whole path — nothing gets built
          until the earlier stages have earned it.
        </p>

        <ol className="mt-5 space-y-2">
          {STAGES.map(([n, name, what]) => (
            <li key={n} className="flex items-baseline gap-3">
              <span className="label w-5 shrink-0">{n}</span>
              <span className="text-[13px] font-medium text-ink">{name}</span>
              <span className="text-[12px] text-ink-faint">— {what}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-[10px] border border-rule bg-surface p-5">
          <span className="label">Your Anthropic API key</span>
          <p className="mt-2 text-[12.5px] leading-[1.6] text-ink-soft">
            The agents run against your own Anthropic account. The key is
            checked against the API, stored encrypted on this machine, and sent
            nowhere except api.anthropic.com.
          </p>

          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="sk-ant-…"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="mt-4 w-full rounded-[8px] border border-rule-strong bg-paper px-3.5 py-3 font-mono text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-ink"
          />

          {hint && (
            <p className="mt-2 text-[12px] text-ink-faint">
              A key is already saved ({hint}). Entering a new one replaces it.
            </p>
          )}
          {!hint && (
            <p className="mt-2 text-[12px] text-ink-faint">
              Create one at{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-ink-soft underline decoration-rule-strong underline-offset-2 hover:text-ink"
              >
                console.anthropic.com
              </a>{" "}
              under API keys.
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-[6px] border border-kill/25 bg-kill-bg px-3 py-2.5 text-[12.5px] leading-relaxed text-kill">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => void bridge.skip()}
              className="label transition-colors duration-150 hover:text-ink"
            >
              {hint ? "Keep current key" : "Skip for now"}
            </button>
            <button
              onClick={() => void submit()}
              disabled={key.trim().length < 8 || busy}
              className="rounded-[8px] bg-ink px-5 py-2.5 text-[13px] font-medium text-paper transition-opacity duration-150 hover:opacity-85 disabled:opacity-25"
            >
              {busy ? "Checking with Anthropic…" : "Validate and save"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11.5px] leading-[1.6] text-ink-faint">
          Change it any time from {menuName} → Anthropic API key.
        </p>
      </div>
    </main>
  );
}
