import { DOWNLOADS, GITHUB_REPO, RELEASES_PUBLISHED } from "@/lib/downloads";
import Mark from "./Mark";

/**
 * Footer: brand block with a dot cluster behind it on the left, link columns
 * on the right, a quiet legal row at the bottom. With the download section
 * gone from the page body, this is where the platform links live.
 */

const COLUMNS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Stack", href: "#stack" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  // Platform links only exist once a release is actually published; until
  // then they would all be GitHub 404s.
  ...(RELEASES_PUBLISHED
    ? [
        {
          heading: "Download",
          links: [
            { label: "Windows", href: DOWNLOADS.windows[0].href, external: true },
            { label: "macOS · Apple silicon", href: DOWNLOADS.mac[0].href, external: true },
            { label: "macOS · Intel", href: DOWNLOADS.mac[1].href, external: true },
            { label: "Linux", href: DOWNLOADS.linux[0].href, external: true },
          ],
        },
        {
          heading: "Resources",
          links: [
            { label: "GitHub", href: `https://github.com/${GITHUB_REPO}`, external: true },
            {
              label: "Releases",
              href: `https://github.com/${GITHUB_REPO}/releases`,
              external: true,
            },
          ],
        },
      ]
    : []),
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden px-6 pb-10 pt-20 sm:px-10">
      {/* dot cluster behind the brand column */}
      <div
        aria-hidden="true"
        className="dot-field pointer-events-none absolute bottom-[8%] left-[16%] h-[360px] w-[380px] opacity-[0.45] [mask-image:radial-gradient(ellipse_55%_60%_at_45%_55%,black,transparent_72%)]"
      />

      <div className="relative mx-auto max-w-[68rem]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))] lg:gap-8">
          <div>
            <Mark className="text-chalk" size={26} />
            <p className="mt-3 max-w-[24ch] text-[13.5px] leading-[1.6] text-chalk-soft">
              Validate first. Build once.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <span className="label">{col.heading}</span>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className="text-[13.5px] text-chalk-soft transition-colors duration-150 hover:text-chalk"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-edge pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-chalk-faint">© Multiplyer 2026</p>
          <p className="text-[12px] text-chalk-faint">
            Runs on your own Anthropic key. Nothing you type leaves your
            machine except to Anthropic.
          </p>
        </div>
      </div>
    </footer>
  );
}
