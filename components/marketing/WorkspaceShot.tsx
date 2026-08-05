/**
 * A faithful, static rendering of the workspace — same three panes, same type
 * scale, same cards as the product. Built in markup rather than shipped as a
 * screenshot so it stays sharp on every display, needs no asset pipeline, and
 * cannot drift into showing a UI that no longer exists.
 *
 * Presentational only: inert, and hidden from assistive tech since the
 * surrounding copy already says what it is.
 */

const CODE = `function App() {
  const [invoices, setInvoices] = React.useState(SEED);

  const outstanding = invoices
    .filter((i) => !i.chased)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <h1 className="text-2xl font-semibold">Overdue</h1>`;

const STAGES: [string, string, string][] = [
  ["01", "Brainstorm", "3 framings"],
  ["02", "Research", "4 competitors · 3 signals"],
  ["03", "Market analysis", "Gap: pricing, not features"],
];

function PaneHead({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex h-[30px] shrink-0 items-center justify-between border-b border-rule px-3">
      <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
        {title}
      </span>
      {meta && (
        <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
          {meta}
        </span>
      )}
    </div>
  );
}

export default function WorkspaceShot() {
  return (
    <div
      aria-hidden="true"
      className="float-y pointer-events-none select-none overflow-hidden rounded-[14px] border border-edge bg-void-2 shadow-[0_50px_140px_-30px_rgba(0,0,0,0.95)]"
    >
      <div className="flex h-[38px] items-center gap-2 border-b border-edge px-4">
        <span className="h-[10px] w-[10px] rounded-full bg-white/12" />
        <span className="h-[10px] w-[10px] rounded-full bg-white/12" />
        <span className="h-[10px] w-[10px] rounded-full bg-white/12" />
        <span className="mx-auto font-mono text-[10px] tracking-[0.06em] text-chalk-faint">
          Multiplyer
        </span>
      </div>

      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-px bg-rule">
        {/* left rail: the run */}
        <div className="flex min-w-0 flex-col bg-surface">
          <div className="border-b border-rule px-3 py-2.5">
            <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
              Idea
            </span>
            <p className="mt-1 text-[10px] leading-[1.45] text-ink">
              a tool that helps freelancers chase late invoices
            </p>
          </div>

          {STAGES.map(([n, label, meta]) => (
            <div key={n} className="border-b border-rule px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-[4px] w-[4px] rounded-full bg-ink" />
                <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                  {n}
                </span>
                <span className="text-[9.5px] font-medium text-ink">{label}</span>
              </div>
              <p className="mt-1 pl-[14px] text-[9px] text-ink-soft">{meta}</p>
            </div>
          ))}

          {/* 04 — the simulation result */}
          <div className="border-b border-rule px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[4px] w-[4px] rounded-full bg-ink" />
              <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                04
              </span>
              <span className="text-[9.5px] font-medium text-ink">Simulate</span>
            </div>

            <div className="mt-2 overflow-hidden rounded-[6px] border border-rule bg-sunk">
              <div className="flex items-end justify-between px-2.5 pt-2.5">
                <div>
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.09em] text-ink-faint">
                    Would adopt
                  </span>
                  <p className="display text-[15px] text-ink">7 of 12</p>
                </div>
                <p className="font-mono text-[9px] leading-none text-ink-soft">
                  synthetic
                  <br />
                  users
                </p>
              </div>
              <div className="mt-2 border-t border-rule bg-surface px-2.5 py-2">
                <p className="text-[8.5px] leading-[1.5] text-ink">
                  Strongest objection: they already forgive the first week late
                  and want the tool to wait, not to chase immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-rule px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[4px] w-[4px] rounded-full bg-ink" />
              <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                05
              </span>
              <span className="text-[9.5px] font-medium text-ink">Build</span>
            </div>
            <div className="mt-1.5 space-y-1 pl-[14px] font-mono text-[8px] text-ink-soft">
              <p>&gt; wrote App.jsx</p>
              <p>&gt; wrote README.md</p>
              <p>&gt; done, 2 files generated</p>
            </div>
          </div>

          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-[4px] w-[4px] rounded-full bg-ink" />
              <span className="font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
                06
              </span>
              <span className="text-[9.5px] font-medium text-ink">Market</span>
            </div>
            <p className="mt-1 pl-[14px] text-[9px] text-ink-soft">
              3 posts drafted · X, LinkedIn, r/freelance
            </p>
          </div>
        </div>

        {/* middle: files */}
        <div className="flex min-w-0 flex-col bg-surface">
          <PaneHead title="Files" meta="2 files" />
          <div className="flex shrink-0 gap-1 border-b border-rule px-2 py-1.5">
            {["App.jsx", "README.md"].map((f, i) => (
              <span
                key={f}
                className={`rounded-[3px] px-1.5 py-0.5 font-mono text-[8px] ${
                  i === 0 ? "bg-ink text-paper" : "border border-rule text-ink-soft"
                }`}
              >
                {f}
              </span>
            ))}
          </div>
          <pre className="flex-1 overflow-hidden bg-[#111110] p-2.5 font-mono text-[7.5px] leading-[1.7] text-[#d6d3cc]">
            <code>{CODE}</code>
          </pre>
        </div>

        {/* right: the generated app, running */}
        <div className="flex min-w-0 flex-col bg-surface">
          <PaneHead title="Preview" meta="Reload" />
          <div className="flex-1 bg-neutral-50 p-3">
            <p className="text-[11px] font-semibold text-neutral-900">Overdue</p>
            <p className="mt-0.5 text-[7.5px] text-neutral-500">
              $3,300 unchased
            </p>
            <div className="mt-2.5 space-y-1.5">
              {[
                ["Northwind", "INV-014", "21 days late", false],
                ["Acme Studio", "INV-018", "6 days late", false],
                ["Bluebird", "INV-021", "34 days late", true],
              ].map(([client, id, late, chased]) => (
                <div
                  key={id as string}
                  className="flex items-center justify-between rounded-[5px] border border-neutral-200 bg-white p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[8px] font-medium text-neutral-900">
                      {client}
                    </p>
                    <p className="truncate text-[7px] text-neutral-500">
                      {id} · {late}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-[3px] px-1.5 py-[3px] text-[7px] text-white ${
                      chased ? "bg-neutral-900/40" : "bg-neutral-900"
                    }`}
                  >
                    {chased ? "Chased" : "Send chase"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
