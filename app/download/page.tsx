import type { Metadata } from "next";
import DownloadCTA from "@/components/marketing/DownloadCTA";
import Footer from "@/components/marketing/Footer";
import MarketingNav from "@/components/marketing/MarketingNav";
import WorkspaceShot from "@/components/marketing/WorkspaceShot";
import { GITHUB_REPO } from "@/lib/downloads";
import {
  assetLabel,
  assetPlatform,
  fetchReleases,
  type Release,
} from "@/lib/github";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Download the Multiplyer desktop app for macOS, Windows, and Linux. Free, nothing to configure.",
  alternates: { canonical: "/download" },
};

/** Platform column order, matching how people scan the row. */
const COLUMNS = [
  { key: "mac", heading: "macOS", glyph: AppleGlyph },
  { key: "windows", heading: "Windows", glyph: WindowsGlyph },
  { key: "linux", heading: "Linux", glyph: LinuxGlyph },
] as const;

function AppleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11.182 5.2c-.06.047-1.145.658-1.145 2.014 0 1.569 1.377 2.124 1.418 2.137-.006.034-.219.76-.726 1.5-.452.652-.925 1.302-1.643 1.302-.719 0-.904-.417-1.733-.417-.808 0-1.096.43-1.753.43-.658 0-1.117-.602-1.644-1.343-.61-.869-1.104-2.218-1.104-3.499 0-2.054 1.336-3.143 2.65-3.143.699 0 1.281.458 1.72.458.417 0 1.068-.485 1.863-.485.301 0 1.384.027 2.097 1.046ZM9.708 3.28c.329-.39.561-.93.561-1.472 0-.075-.006-.151-.02-.212-.535.02-1.171.356-1.555.8-.301.343-.582.884-.582 1.432 0 .082.014.165.02.191.034.007.089.014.144.014.48 0 1.083-.321 1.432-.753Z" />
    </svg>
  );
}

function WindowsGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.5 3.4 7 2.65v4.85H1.5ZM8 2.5l6.5-.9v5.9H8ZM1.5 8.5H7v4.85l-5.5-.75ZM8 8.5h6.5v5.9L8 13.5Z" />
    </svg>
  );
}

function LinuxGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5c-1.7 0-2.4 1.3-2.4 2.6 0 .9.1 1.5-.2 2.2-.5 1-1.5 2.1-1.8 3.4-.1.6-.1 1.2.1 1.7-.2.1-.4.3-.5.6-.1.4.1.7.3 1 .1.2.2.5.2.8 0 .3.2.6.6.7.5.2 1.3.4 1.9.7.5.3 1.2.3 1.6-.1h.4c.4.4 1.1.4 1.6.1.6-.3 1.4-.5 1.9-.7.4-.1.6-.4.6-.7 0-.3.1-.6.2-.8.2-.3.4-.6.3-1-.1-.3-.3-.5-.5-.6.2-.5.2-1.1.1-1.7-.3-1.3-1.3-2.4-1.8-3.4-.3-.7-.2-1.3-.2-2.2 0-1.3-.7-2.6-2.4-2.6Zm-1 4.6c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5Zm2 0c.3 0 .5.2.5.5s-.2.5-.5.5-.5-.2-.5-.5.2-.5.5-.5Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5v8m0 0 3-3m-3 3-3-3M3 13.5h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReleaseBlock({ release, latest }: { release: Release; latest: boolean }) {
  return (
    <section className="border-t border-edge pt-8">
      <div className="flex items-center gap-3">
        <h2 className="display text-[1.5rem] text-chalk">
          {release.tag_name.replace(/^v/, "")}
        </h2>
        {latest && (
          <span className="rounded-full border border-edge-strong px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.09em] text-chalk-soft">
            Latest
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const assets = release.assets.filter(
            (a) => assetPlatform(a.name) === col.key,
          );
          if (assets.length === 0) return null;
          const Glyph = col.glyph;
          return (
            <div
              key={col.key}
              className="rounded-[14px] border border-edge bg-void-2 p-5"
            >
              <div className="flex items-center gap-2 text-chalk">
                <Glyph />
                <h3 className="text-[13.5px] font-medium">{col.heading}</h3>
              </div>
              <ul className="mt-3">
                {assets.map((a) => (
                  <li key={a.name} className="border-t border-edge">
                    <a
                      href={a.browser_download_url}
                      className="group flex items-center justify-between gap-4 py-3.5 text-[13.5px] text-chalk-soft transition-colors duration-150 hover:text-chalk"
                    >
                      {assetLabel(a.name)}
                      <span className="text-chalk-faint transition-colors duration-150 group-hover:text-chalk">
                        <DownloadIcon />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function DownloadPage() {
  const releases = await fetchReleases();
  const withAssets = releases.filter((r) => r.assets.length > 0);

  return (
    <div className="marketing relative flex min-h-dvh flex-col overflow-x-clip">
      <MarketingNav />

      <main className="relative flex-1 px-6 pb-24 pt-32 sm:px-10">
        <div className="mx-auto max-w-[68rem]">
          {/* Cursor-style top: headline, then the one surface we ship —
              a Desktop card with the product in it and the button below. */}
          <h1 className="display max-w-[22ch] text-[1.75rem] text-chalk sm:text-[2.25rem]">
            Use Multiplyer where you build.
          </h1>
          <p className="mt-3 text-[15px] text-chalk-soft">
            The desktop app, for macOS, Windows, and Linux.
          </p>

          <div className="mt-10 rounded-[20px] border border-edge bg-void-2 p-4 sm:p-6">
            <WorkspaceShot />
            <div className="mt-6 flex flex-col gap-5 px-2 pb-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[16px] font-medium text-chalk">Desktop</h2>
                <p className="mt-1.5 max-w-[44ch] text-[13.5px] leading-[1.6] text-chalk-soft">
                  All six agents in one native window. Nothing to configure.
                </p>
              </div>
              <DownloadCTA />
            </div>
          </div>

          {/* Scroll: every installer, per release. */}
          <h2 className="mt-24 text-[15px] font-medium text-chalk-soft">
            All downloads
          </h2>

          <div className="mt-6 space-y-12">
            {withAssets.length > 0 ? (
              withAssets.map((r, i) => (
                <ReleaseBlock key={r.tag_name} release={r} latest={i === 0} />
              ))
            ) : (
              <p className="border-t border-edge pt-8 text-[14px] text-chalk-soft">
                Builds are published on GitHub.{" "}
                <a
                  href={`https://github.com/${GITHUB_REPO}/releases/latest`}
                  className="text-chalk underline underline-offset-4"
                >
                  Get the latest release
                </a>
                .
              </p>
            )}
          </div>

          <a
            href={`https://github.com/${GITHUB_REPO}/releases`}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-1.5 text-[13.5px] text-signal transition-opacity duration-150 hover:opacity-80"
          >
            View release notes
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
