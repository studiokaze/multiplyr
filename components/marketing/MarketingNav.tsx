"use client";

import { useEffect, useState } from "react";
import { DOWNLOADS, GITHUB_REPO, RELEASES_PUBLISHED } from "@/lib/downloads";
import { Glyph, usePlatform } from "./DownloadCTA";
import Mark from "./Mark";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const RELEASES = `https://github.com/${GITHUB_REPO}/releases/latest`;

export default function MarketingNav() {
  // Lift the bar off the page once scrolled, so it reads as a floating
  // instrument rather than a header stuck to the top of a document.
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const platform = usePlatform();
  const primary = platform === "unknown" ? null : DOWNLOADS[platform][0];

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`pointer-events-auto flex w-full max-w-[62rem] items-center justify-between rounded-full border px-2 py-2 pl-5 transition-colors duration-300 ${
          lifted
            ? "border-edge bg-void-2/85 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <a
          href="#top"
          aria-label="Multiplyer, back to top"
          className="text-chalk transition-opacity duration-200 hover:opacity-80"
        >
          <Mark size={22} />
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-chalk-soft transition-colors duration-150 hover:text-chalk"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className="hidden rounded-full p-2 text-chalk-soft transition-colors duration-150 hover:text-chalk sm:block"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>

          {RELEASES_PUBLISHED ? (
            <a
              href={primary?.href ?? RELEASES}
              className="spring-hover flex items-center gap-2 rounded-full bg-chalk px-4 py-2 text-[13px] font-medium text-void"
            >
              {platform !== "unknown" && <Glyph platform={platform} />}
              Download
            </a>
          ) : (
            <span className="flex cursor-default items-center rounded-full border border-edge-strong px-4 py-2 text-[13px] font-medium text-chalk-soft">
              Coming soon
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
