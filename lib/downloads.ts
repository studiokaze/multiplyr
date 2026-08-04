/**
 * Direct-download config. Installers are attached to a GitHub Release by
 * .github/workflows/release.yml, and electron-builder is configured with fixed
 * artifact names so these URLs never need to know the version.
 *
 * Set NEXT_PUBLIC_GITHUB_REPO to "owner/repo" once the repo exists.
 */
export const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO ?? "your-org/multipyler";

/**
 * Until a real repo is configured, every release URL points at a repository
 * that does not exist — so the buttons would hand visitors a GitHub 404.
 * When this is false the UI offers no dead links.
 */
export const RELEASES_PUBLISHED =
  !GITHUB_REPO.startsWith("your-org/") && GITHUB_REPO.includes("/");

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
      href: `${RELEASE_BASE}/multipyler-setup.exe`,
    },
  ],
  mac: [
    {
      label: "Download for macOS",
      sub: "Apple silicon · .dmg",
      href: `${RELEASE_BASE}/multipyler-mac-arm64.dmg`,
    },
    {
      label: "Download for macOS",
      sub: "Intel · .dmg",
      href: `${RELEASE_BASE}/multipyler-mac-x64.dmg`,
    },
  ],
  linux: [
    {
      label: "Download for Linux",
      sub: "x86_64 · AppImage",
      href: `${RELEASE_BASE}/multipyler-linux-x86_64.AppImage`,
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
