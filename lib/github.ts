import { GITHUB_REPO } from "./downloads";

/**
 * Server-side reads of the public GitHub API. Unauthenticated: the repo is
 * public and every fetch is cached, so the 60/hr rate limit is never near.
 */

export type ReleaseAsset = {
  name: string;
  browser_download_url: string;
  download_count: number;
  size: number;
};

export type Release = {
  tag_name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
};

const API = `https://api.github.com/repos/${GITHUB_REPO}`;

const HEADERS = {
  Accept: "application/vnd.github+json",
  // GitHub rejects requests without a User-Agent.
  "User-Agent": "multiplyer-site",
};

/** All releases, newest first. Empty array when the API is unreachable. */
export async function fetchReleases(): Promise<Release[]> {
  try {
    const res = await fetch(`${API}/releases?per_page=20`, {
      headers: HEADERS,
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const releases = (await res.json()) as Release[];
    // Installer assets only — checksums and blockmaps are build plumbing.
    return releases.map((r) => ({
      ...r,
      assets: r.assets.filter((a) =>
        /\.(exe|dmg|AppImage)$/i.test(a.name),
      ),
    }));
  } catch {
    return [];
  }
}

export type RepoStats = {
  stars: number;
  forks: number;
  watchers: number;
};

export async function fetchRepoStats(): Promise<RepoStats | null> {
  try {
    const res = await fetch(API, {
      headers: HEADERS,
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const repo = (await res.json()) as {
      stargazers_count: number;
      forks_count: number;
      subscribers_count: number;
    };
    return {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.subscribers_count,
    };
  } catch {
    return null;
  }
}

/** Which platform column an installer belongs in. */
export function assetPlatform(name: string): "mac" | "windows" | "linux" {
  if (/\.dmg$/i.test(name)) return "mac";
  if (/\.exe$/i.test(name)) return "windows";
  return "linux";
}

/** "Multiplyer-mac-arm64.dmg" -> "Mac (ARM64)" and friends. */
export function assetLabel(name: string): string {
  if (/mac-arm64/i.test(name)) return "Mac (ARM64)";
  if (/mac-x64/i.test(name)) return "Mac (x64)";
  if (/setup\.exe$/i.test(name)) return "Windows (x64)";
  if (/AppImage$/i.test(name)) return "Linux AppImage (x64)";
  return name;
}
