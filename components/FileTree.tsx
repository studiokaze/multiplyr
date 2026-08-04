"use client";

import { useState } from "react";
import type { GeneratedFile } from "@/lib/types";

/** File list on the left, editor on the right — the shape every builder uses. */

function download(file: GeneratedFile) {
  const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Flatten any nested path — browsers ignore directories in `download`.
  a.download = file.path.split("/").pop() || "file.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function FileIcon({ path }: { path: string }) {
  const isCode = /\.(jsx?|tsx?|mjs|cjs)$/i.test(path);
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M9 1.6H4.2a1.2 1.2 0 0 0-1.2 1.2v10.4a1.2 1.2 0 0 0 1.2 1.2h7.6a1.2 1.2 0 0 0 1.2-1.2V5.6L9 1.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {isCode && (
        <path
          d="M6.4 8.6 5.2 9.9l1.2 1.3M9.6 8.6l1.2 1.3-1.2 1.3"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function FileTree({ files }: { files: GeneratedFile[] }) {
  // Only the user's explicit choice is state. Everything else is derived, so
  // the pane follows the agent to the newest file until the user takes over.
  const [picked, setPicked] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const active = files.find((f) => f.path === picked) ?? files[files.length - 1];

  const copy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard is blocked outside a secure context; download still works.
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col bg-surface">
        <div className="flex h-[38px] shrink-0 items-center border-b border-rule px-4">
          <span className="label">Files</span>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="max-w-[17rem] text-center text-[12.5px] leading-[1.55] text-ink-faint">
            Generated files appear here once a build verdict releases the
            builder agent.
          </p>
        </div>
      </div>
    );
  }

  const lines = (active?.content ?? "").split("\n");

  return (
    <div className="grid h-full grid-cols-[190px_minmax(0,1fr)] bg-surface">
      {/* file list */}
      <div className="flex min-h-0 flex-col border-r border-rule">
        <div className="flex h-[38px] shrink-0 items-center justify-between border-b border-rule px-3">
          <span className="label">Files</span>
          <span className="label">{files.length}</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {files.map((f) => (
            <li key={f.path}>
              <button
                onClick={() => setPicked(f.path)}
                className={`flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left font-mono text-[11.5px] transition-colors duration-150 ${
                  f.path === active?.path
                    ? "bg-sunk text-ink"
                    : "text-ink-soft hover:bg-sunk/60 hover:text-ink"
                }`}
              >
                <FileIcon path={f.path} />
                <span className="truncate">{f.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* editor */}
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="flex h-[38px] shrink-0 items-center justify-between gap-3 border-b border-rule px-4">
          <span className="truncate font-mono text-[11.5px] text-ink-soft">
            {active?.path}
          </span>
          <div className="flex shrink-0 items-center gap-3">
            <span className="label">{lines.length} lines</span>
            <button
              onClick={copy}
              className="label transition-colors duration-150 hover:text-ink"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => active && download(active)}
              className="label transition-colors duration-150 hover:text-ink"
            >
              Download
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#111110]">
          <div className="flex min-w-0">
            {/* gutter */}
            <div
              aria-hidden="true"
              className="shrink-0 select-none py-4 pl-4 pr-3 text-right font-mono text-[11.5px] leading-[1.65] text-[#4a4842]"
            >
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <pre className="min-w-0 flex-1 py-4 pr-4 font-mono text-[11.5px] leading-[1.65] text-[#d6d3cc]">
              <code>{active?.content ?? ""}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
