"use client";

import { useMemo, useState } from "react";
import { documentFor } from "@/lib/share";
import type { GeneratedFile } from "@/lib/types";

/**
 * Runs the builder agent's App.jsx in a sandboxed iframe.
 *
 * No build step — React, Babel and Tailwind come from CDNs and the component
 * source is evaluated as a script, which is why buildPrompt tells the agent to
 * emit import-free, export-free JSX.
 */
/** Viewport presets, as every builder offers. */
const DEVICES = {
  desktop: { label: "Desktop", width: null as number | null },
  tablet: { label: "Tablet", width: 834 },
  mobile: { label: "Phone", width: 390 },
};

type DeviceKey = keyof typeof DEVICES;

function DeviceIcon({ device }: { device: DeviceKey }) {
  if (device === "mobile") {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M7 12.6h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (device === "tablet") {
    return (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2.8" y="1.8" width="10.4" height="12.4" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="8.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 14h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function PreviewPane({ files }: { files: GeneratedFile[] }) {
  const app = files.find((f) => f.path.toLowerCase().endsWith("app.jsx"));
  const [reloads, setReloads] = useState(0);
  const [device, setDevice] = useState<DeviceKey>("desktop");

  const srcDoc = useMemo(() => (app ? documentFor(app.content) : ""), [app]);

  /** Opens the running app in the user's browser, standalone. */
  const openExternally = () => {
    const blob = new Blob([srcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    // Give the new tab time to load before dropping the object URL.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  const width = DEVICES[device].width;

  return (
    <div className="flex h-full flex-col bg-sunk">
      <div className="flex h-[38px] shrink-0 items-center justify-between gap-3 border-b border-rule bg-surface px-3">
        <div className="flex items-center gap-0.5">
          {(Object.keys(DEVICES) as DeviceKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setDevice(k)}
              title={DEVICES[k].label}
              aria-pressed={device === k}
              className={`flex h-[26px] w-[28px] items-center justify-center rounded-[5px] transition-colors duration-150 ${
                device === k
                  ? "bg-sunk text-ink"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              <DeviceIcon device={k} />
            </button>
          ))}
          {width && (
            <span className="ml-1.5 font-mono text-[10px] text-ink-faint">
              {width}px
            </span>
          )}
        </div>

        {app && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReloads((n) => n + 1)}
              className="label transition-colors duration-150 hover:text-ink"
            >
              Reload
            </button>
            <button
              onClick={openExternally}
              className="label transition-colors duration-150 hover:text-ink"
            >
              Open in browser
            </button>
          </div>
        )}
      </div>

      {app ? (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {device === "mobile" ? (
            /* Demo mode: the app in a device chassis, to be tested like a
               real phone — bezel, notch, home bar and all. */
            <div className="mx-auto flex h-full max-w-[390px] flex-col rounded-[44px] border-[10px] border-[#1b1b1f] bg-[#1b1b1f] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.8),inset_0_0_0_2px_#000]">
              <div className="relative shrink-0 rounded-t-[34px] bg-white">
                <span className="absolute left-1/2 top-2 h-[22px] w-[110px] -translate-x-1/2 rounded-full bg-[#1b1b1f]" />
                <div className="h-[34px]" />
              </div>
              <iframe
                key={`${srcDoc.length}-${reloads}`}
                title="Device demo"
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                className="min-h-0 w-full flex-1 border-0 bg-white"
              />
              <div className="flex shrink-0 justify-center rounded-b-[34px] bg-white pb-2 pt-1.5">
                <span className="h-[4px] w-[110px] rounded-full bg-[#1b1b1f]/70" />
              </div>
            </div>
          ) : (
            <div
              className="mx-auto h-full overflow-hidden rounded-[10px] border border-rule bg-white shadow-[0_10px_40px_-18px_rgba(0,0,0,0.35)]"
              style={{ maxWidth: width ?? "100%" }}
            >
              <iframe
                key={`${srcDoc.length}-${reloads}`}
                title="Live preview"
                srcDoc={srcDoc}
                sandbox="allow-scripts"
                className="h-full w-full border-0 bg-white"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="max-w-[17rem] text-center text-[12.5px] leading-[1.55] text-ink-faint">
            The generated app runs here, sandboxed, as soon as the builder
            writes App.jsx.
          </p>
        </div>
      )}
    </div>
  );
}
