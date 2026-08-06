"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarkGlyph } from "@/components/marketing/Mark";
import { decodeShare, documentFor } from "@/lib/share";
import type { GeneratedFile } from "@/lib/types";

/**
 * A shared build, running. The whole app travels in the URL fragment — this
 * page decodes it and runs it in the same sandbox the workspace preview
 * uses. The fragment never reaches the server, so there is nothing stored
 * and nothing to expire.
 */
export default function SharePage() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "bad" }
    | { kind: "ok"; idea: string; files: GeneratedFile[] }
  >({ kind: "loading" });

  useEffect(() => {
    const read = () => {
      const decoded = decodeShare(window.location.hash);
      setState(decoded ? { kind: "ok", ...decoded } : { kind: "bad" });
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const app =
    state.kind === "ok"
      ? state.files.find((f) => f.path.toLowerCase().endsWith("app.jsx"))
      : null;

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="flex h-[44px] shrink-0 items-center justify-between border-b border-rule bg-surface px-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <MarkGlyph size={16} className="shrink-0 text-ink" />
          <span className="truncate text-[12.5px] text-ink-soft">
            {state.kind === "ok" && state.idea
              ? state.idea
              : "A build shared from Multiplyer"}
          </span>
        </span>
        <Link
          href="/"
          className="shrink-0 rounded-[7px] bg-ink px-3 py-1.5 text-[12px] font-medium text-paper transition-opacity duration-150 hover:opacity-85"
        >
          Build yours
        </Link>
      </header>

      {state.kind === "ok" && app ? (
        <iframe
          title="Shared build"
          srcDoc={documentFor(app.content)}
          sandbox="allow-scripts"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="max-w-[24rem] text-center text-[13px] leading-[1.6] text-ink-soft">
            {state.kind === "loading"
              ? "Opening the shared build…"
              : "This link doesn't contain a runnable build — it may have been truncated in transit. Ask for the link again."}
          </p>
        </div>
      )}
    </div>
  );
}
