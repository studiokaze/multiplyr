/**
 * Direct-download config. Installers are attached to a GitHub Release by
 * .github/workflows/release.yml, and electron-builder is configured with fixed
 * artifact names so these URLs never need to know the version.
 *
 * Set NEXT_PUBLIC_GITHUB_REPO to "owner/repo" once the repo exists.
 */
/**
 * Public config, not a secret — defaulted in code rather than left to an
 * env file. `.env.local` is gitignored, so anything that lives only there is
 * missing from every deploy that is not this machine.
 */
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "studiokaze/multiplyer";

/**
 * Whether installers are actually downloadable.
 *
 * Deliberately an explicit opt-in rather than something inferred from the repo
 * name: a configured repo does not mean a published release, and a private
 * repo's assets are not publicly downloadable at all. Set
 * NEXT_PUBLIC_RELEASES_PUBLISHED=true only once `gh release view` shows the
 * installers attached to a public release — until then the UI shows
 * "coming soon" instead of handing visitors a GitHub 404.
 */
export const RELEASES_PUBLISHED =
  process.env.NEXT_PUBLIC_RELEASES_PUBLISHED !== "false";

const RELEASE_BASE = `https://github.com/${GITHUB_REPO}/releases/latest/download`;

export type Platform = "windows" | "mac" | "linux" | "unknown";

export type Download = {
  label: string;
  sub: string;
  href: string;
};

export const DOWNLOADS: Record<Exclude<Platform, "unknown">, Download[]> = {
  windows: [
    {
      label: "Download for Windows",
      sub: "64-bit installer · .exe",
      href: `${RELEASE_BASE}/Multiplyer-setup.exe`,
    },
  ],
  mac: [
    {
      label: "Download for macOS",
      sub: "Apple silicon · .dmg",
      href: `${RELEASE_BASE}/Multiplyer-mac-arm64.dmg`,
    },
    {
      label: "Download for macOS",
      sub: "Intel · .dmg",
      href: `${RELEASE_BASE}/Multiplyer-mac-x64.dmg`,
    },
  ],
  linux: [
    {
      label: "Download for Linux",
      sub: "x86_64 · AppImage",
      href: `${RELEASE_BASE}/Multiplyer-linux-x86_64.AppImage`,
    },
  ],
};

/**
 * Read once on the client. Architecture is deliberately not sniffed — the
 * browser cannot tell Apple silicon from Intel reliably, so macOS visitors are
 * offered both rather than guessed at.
 */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const source =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ||
    navigator.platform ||
    navigator.userAgent;
  if (/win/i.test(source)) return "windows";
  if (/mac|iphone|ipad/i.test(source)) return "mac";
  if (/linux|android|x11/i.test(source)) return "linux";
  return "unknown";
}
