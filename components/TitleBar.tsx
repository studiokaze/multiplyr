"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * The desktop app's top line, Cursor-style: one slim draggable bar carrying
 * the mark and the menu labels; the OS overlays its window controls on the
 * right. Renders nothing on the web — there is no window to manage there.
 *
 * The labels are HTML but the menus are real: each click asks the main
 * process to pop the corresponding native submenu just beneath the bar.
 */

type Bridge = {
  platform?: string;
  menuPopup?: (label: string, x: number) => Promise<void>;
};

const MENUS = ["File", "Edit", "View", "Help"];

const subscribe = () => () => {};
function useBridge(): Bridge | null {
  return useSyncExternalStore(
    subscribe,
    () => (window as { multiplyer?: Bridge }).multiplyer ?? null,
    () => null,
  );
}

export default function TitleBar() {
  const bridge = useBridge();
  const shown = Boolean(bridge?.menuPopup && bridge.platform !== "darwin");

  // Full-height app screens subtract the bar via this class.
  useEffect(() => {
    document.body.classList.toggle("has-titlebar", shown);
    return () => document.body.classList.remove("has-titlebar");
  }, [shown]);

  if (!shown || !bridge) return null;

  return (
    <header
      className="flex h-[36px] shrink-0 select-none items-center gap-1 border-b border-rule bg-paper pl-3 pr-[150px]"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Sidebar toggle, not a logo — broadcasts to whichever screen listens. */}
      <button
        onClick={() =>
          window.dispatchEvent(new Event("multiplyer:toggle-sidebar"))
        }
        title="Toggle sidebar"
        aria-label="Toggle sidebar"
        className="mr-1.5 rounded-[5px] p-1.5 text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
      </button>
      {MENUS.map((label) => (
        <button
          key={label}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            void bridge.menuPopup?.(label, rect.left);
          }}
          className="rounded-[5px] px-2.5 py-1 text-[12px] text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {label}
        </button>
      ))}
    </header>
  );
}
