"use client";

import { useSyncExternalStore } from "react";
import {
  DOWNLOADS,
  GITHUB_REPO,
  RELEASES_PUBLISHED,
  detectPlatform,
  type Platform,
} from "@/lib/downloads";

// The platform cannot change during a session, so the store never notifies.
// useSyncExternalStore gives a server snapshot and a client snapshot without
// an effect, so there is no hydration mismatch and no second render.
const subscribe = () => () => {};

export function usePlatform(): Platform {
  return useSyncExternalStore(
    subscribe,
    detectPlatform,
    () => "unknown" as Platform,
  );
}

const OS_NAME: Record<Exclude<Platform, "unknown">, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
};

function WindowsGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 2.4L6.5 1.5V7.5H0V2.4ZM7.4 1.4L16 0.2V7.5H7.4V1.4ZM0 8.5H6.5V14.5L0 13.6V8.5ZM7.4 8.5H16V15.8L7.4 14.6V8.5Z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11.05 8.47c-.02-1.72 1.4-2.55 1.47-2.59-.8-1.17-2.05-1.33-2.5-1.35-1.06-.11-2.07.62-2.61.62-.54 0-1.37-.6-2.25-.59-1.16.02-2.23.67-2.82 1.71-1.2 2.09-.31 5.18.86 6.87.57.83 1.26 1.76 2.16 1.72.87-.03 1.2-.56 2.24-.56s1.34.56 2.25.54c.93-.02 1.52-.84 2.09-1.67.66-.96.93-1.89.94-1.94-.02-.01-1.81-.7-1.83-2.76ZM9.4 3.4c.48-.58.8-1.39.71-2.19-.69.03-1.52.46-2.01 1.03-.44.51-.83 1.34-.72 2.12.77.06 1.55-.39 2.02-.96Z" />
    </svg>
  );
}

function LinuxGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 .8c-1.7 0-2.6 1.3-2.6 3.1 0 .9.1 1.6-.3 2.4-.5 1-1.6 2.1-2 3.5-.3 1-.1 1.7.3 1.9.3.2.4.5.4.9 0 .9.9 1.6 2.4 1.6h3.6c1.5 0 2.4-.7 2.4-1.6 0-.4.1-.7.4-.9.4-.2.6-.9.3-1.9-.4-1.4-1.5-2.5-2-3.5-.4-.8-.3-1.5-.3-2.4C10.6 2.1 9.7.8 8 .8Zm-.9 2.5c.3 0 .5.3.5.6s-.2.6-.5.6-.5-.3-.5-.6.2-.6.5-.6Zm1.9 0c.3 0 .5.3.5.6s-.2.6-.5.6-.5-.3-.5-.6.2-.6.5-.6ZM8 5.3c.6 0 1.2.3 1.2.6 0 .3-.6.7-1.2.7s-1.2-.4-1.2-.7c0-.3.6-.6 1.2-.6Z" />
    </svg>
  );
}

export function Glyph({ platform }: { platform: Exclude<Platform, "unknown"> }) {
  if (platform === "mac") return <AppleGlyph />;
  if (platform === "linux") return <LinuxGlyph />;
  return <WindowsGlyph />;
}

export default function DownloadCTA() {
  const platform = usePlatform();

  // No release published yet: say so plainly rather than handing the visitor
  // a GitHub 404.
  if (!RELEASES_PUBLISHED) {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="inline-flex cursor-default items-center gap-2.5 rounded-full border border-edge-strong px-7 py-3.5 text-[14px] font-medium text-chalk-soft">
          Builds coming soon
        </span>
        <p className="text-[12.5px] text-chalk-faint">
          Windows, macOS and Linux. Direct download, no app store
        </p>
      </div>
    );
  }

  // Server render and unrecognised platforms get a neutral label rather than
  // a guess that could be wrong on first paint.
  if (platform === "unknown") {
    return (
      <div className="flex flex-col items-center gap-3">
        <a
          href={`https://github.com/${GITHUB_REPO}/releases/latest`}
          className="inline-flex items-center gap-2.5 spring-hover rounded-full bg-chalk px-7 py-3.5 text-[14px] font-medium text-void"
        >
          Download the app
        </a>
        <p className="text-[12.5px] text-chalk-faint">
          Windows, macOS and Linux
        </p>
      </div>
    );
  }

  const [primary, ...rest] = DOWNLOADS[platform];

  return (
    <div className="flex flex-col items-center gap-3.5">
      <a
        href={primary.href}
        className="group inline-flex items-center gap-2.5 spring-hover rounded-full bg-chalk px-7 py-3.5 text-[14px] font-medium text-void"
      >
        <Glyph platform={platform} />
        Download for {OS_NAME[platform]}
      </a>

      <p className="flex flex-wrap items-center justify-center gap-x-2 text-[12.5px] text-chalk-faint">
        <span>Free · {primary.sub}</span>
        {rest.map((d) => (
          <a
            key={d.href}
            href={d.href}
            className="text-chalk-soft underline decoration-white/20 underline-offset-[3px] transition-colors duration-150 hover:text-chalk"
          >
            {d.sub.split(" · ")[0]} build
          </a>
        ))}
      </p>
    </div>
  );
}
