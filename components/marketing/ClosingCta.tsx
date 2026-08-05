"use client";

import { DOWNLOADS, GITHUB_REPO, RELEASES_PUBLISHED } from "@/lib/downloads";
import { Glyph, usePlatform } from "./DownloadCTA";

/**
 * The closing ask: one line and one button, on an otherwise empty band. The
 * whole page has been argument up to here, so this section deliberately
 * carries no supporting copy.
 */
export default function ClosingCta() {
  const platform = usePlatform();
  const primary = platform === "unknown" ? null : DOWNLOADS[platform][0];

  return (
    <section className="relative overflow-hidden px-6 py-32 sm:px-10">
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute inset-x-0 bottom-0 h-[420px] rotate-180"
      />

      <div className="relative mx-auto max-w-[62rem] text-center">
        <h2 className="display text-[2.25rem] text-chalk sm:text-[3.5rem]">
          Try Multiplyr now.
        </h2>

        <div className="mt-9 flex justify-center">
          {RELEASES_PUBLISHED ? (
            <a
              href={
                primary?.href ??
                `https://github.com/${GITHUB_REPO}/releases/latest`
              }
              className="spring-hover inline-flex items-center gap-2.5 rounded-full bg-chalk px-7 py-3.5 text-[14px] font-medium text-void"
            >
              {platform !== "unknown" && <Glyph platform={platform} />}
              {platform === "unknown"
                ? "Download the app"
                : `Download for ${
                    platform === "mac"
                      ? "macOS"
                      : platform === "linux"
                        ? "Linux"
                        : "Windows"
                  }`}
            </a>
          ) : (
            <span className="inline-flex cursor-default items-center rounded-full border border-edge-strong px-7 py-3.5 text-[14px] font-medium text-chalk-soft">
              Builds coming soon
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
