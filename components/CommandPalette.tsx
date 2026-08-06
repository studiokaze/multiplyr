"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Ctrl/Cmd+K command palette (Flow 13). Callers hand it a flat list of
 * actions; it owns the shortcut, filtering, keyboard selection and the
 * overlay. Small on purpose — a palette earns its keep by being instant.
 */

export type Command = {
  label: string;
  hint?: string;
  run: () => void;
};

export default function CommandPalette({ commands }: { commands: Command[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? commands.filter((c) => c.label.toLowerCase().includes(q))
      : commands;
  }, [commands, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setIndex(0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const pick = (c: Command) => {
    setOpen(false);
    c.run();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[18vh]"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[26rem] overflow-hidden rounded-[12px] border border-rule-strong bg-surface shadow-[0_24px_64px_-24px_rgba(0,0,0,0.9)]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && shown[index]) {
              pick(shown[index]);
            }
          }}
          placeholder="Type a command…"
          className="w-full border-b border-rule bg-transparent px-4 py-3 font-sans text-[13.5px] text-ink outline-none placeholder:text-ink-faint"
        />
        <ul className="max-h-[40vh] overflow-y-auto p-1.5">
          {shown.length === 0 && (
            <li className="px-3 py-2.5 text-[12.5px] text-ink-faint">
              Nothing matches.
            </li>
          )}
          {shown.map((c, i) => (
            <li key={c.label}>
              <button
                onClick={() => pick(c)}
                onMouseEnter={() => setIndex(i)}
                className={`flex w-full items-center justify-between gap-3 rounded-[7px] px-3 py-2 text-left text-[12.5px] transition-colors duration-100 ${
                  i === index ? "bg-sunk text-ink" : "text-ink-soft"
                }`}
              >
                {c.label}
                {c.hint && <span className="label shrink-0">{c.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
