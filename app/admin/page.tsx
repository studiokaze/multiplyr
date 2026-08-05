import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkSession } from "@/lib/admin";
import { GITHUB_REPO } from "@/lib/downloads";
import {
  assetLabel,
  assetPlatform,
  fetchReleases,
  fetchRepoStats,
} from "@/lib/github";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// The gate reads a cookie, so this page can never be prerendered.
export const dynamic = "force-dynamic";

function Gate({ denied }: { denied: boolean }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <form
        method="POST"
        action="/api/admin/login"
        className="w-full max-w-[22rem] rounded-[16px] border border-edge bg-void-2 p-6"
      >
        <h1 className="text-[15px] font-medium text-chalk">Admin</h1>
        <input
          type="password"
          name="key"
          required
          autoFocus
          placeholder="Admin key"
          className="mt-4 w-full rounded-[10px] border border-edge-strong bg-void px-3.5 py-2.5 text-[13.5px] text-chalk placeholder:text-chalk-faint focus:outline-none"
        />
        {denied && (
          <p className="mt-2 text-[12.5px] text-red-400">Wrong key.</p>
        )}
        <button
          type="submit"
          className="spring-hover mt-4 w-full rounded-[10px] bg-chalk px-4 py-2.5 text-[13px] font-medium text-void"
        >
          Enter
        </button>
      </form>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-edge bg-void-2 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.09em] text-chalk-faint">
        {label}
      </p>
      <p className="display mt-2 text-[2rem] text-chalk">{value}</p>
    </div>
  );
}

async function Dashboard() {
  const [releases, stats] = await Promise.all([
    fetchReleases(),
    fetchRepoStats(),
  ]);

  const totals = { windows: 0, mac: 0, linux: 0 };
  for (const r of releases) {
    for (const a of r.assets) totals[assetPlatform(a.name)] += a.download_count;
  }
  const total = totals.windows + totals.mac + totals.linux;

  return (
    <main className="flex-1 px-6 pb-24 pt-32 sm:px-10">
      <div className="mx-auto max-w-[62rem]">
        <div className="flex items-center justify-between">
          <h1 className="display text-[1.75rem] text-chalk">Admin</h1>
          <form method="POST" action="/api/admin/logout">
            <button
              type="submit"
              className="rounded-full border border-edge-strong px-4 py-2 text-[12.5px] text-chalk-soft transition-colors duration-150 hover:text-chalk"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total downloads" value={total} />
          <Stat label="Windows" value={totals.windows} />
          <Stat label="macOS" value={totals.mac} />
          <Stat label="Linux" value={totals.linux} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat label="Stars" value={stats?.stars ?? "—"} />
          <Stat label="Forks" value={stats?.forks ?? "—"} />
          <Stat label="Watchers" value={stats?.watchers ?? "—"} />
        </div>

        <section className="mt-10">
          <h2 className="text-[15px] font-medium text-chalk">
            Downloads by release
          </h2>
          <div className="mt-4 overflow-x-auto rounded-[14px] border border-edge">
            <table className="w-full min-w-[36rem] text-left text-[13px]">
              <thead>
                <tr className="border-b border-edge bg-void-2 text-chalk-faint">
                  <th className="px-4 py-3 font-medium">Release</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Published</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Downloads
                  </th>
                </tr>
              </thead>
              <tbody className="text-chalk-soft">
                {releases.flatMap((r) =>
                  r.assets.map((a, i) => (
                    <tr key={a.name + r.tag_name} className="border-b border-edge last:border-0">
                      <td className="px-4 py-3 text-chalk">
                        {i === 0 ? r.tag_name : ""}
                      </td>
                      <td className="px-4 py-3">{assetLabel(a.name)}</td>
                      <td className="px-4 py-3">
                        {i === 0 ? r.published_at.slice(0, 10) : ""}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-chalk">
                        {a.download_count}
                      </td>
                    </tr>
                  )),
                )}
                {releases.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-chalk-faint" colSpan={4}>
                      GitHub API unreachable — try again in a minute.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-[15px] font-medium text-chalk">Users</h2>
          <p className="mt-3 max-w-[52ch] text-[13.5px] leading-[1.65] text-chalk-soft">
            No accounts exist yet — the app runs on each person&apos;s own
            Anthropic key with no sign-up, and the site sets no analytics.
            Download counts above are the closest real number. When accounts
            ship with the paid plans, they will appear here.
          </p>
        </section>

        <p className="mt-10 text-[12px] text-chalk-faint">
          Live from the GitHub API for {GITHUB_REPO}, cached ten minutes.
        </p>
      </div>
    </main>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [jar, params] = await Promise.all([cookies(), searchParams]);
  const authed = checkSession(jar.get(ADMIN_COOKIE)?.value);

  return (
    <div className="marketing relative flex min-h-dvh flex-col">
      {authed ? <Dashboard /> : <Gate denied={params.denied === "1"} />}
    </div>
  );
}
