import { RELEASES_PUBLISHED, GITHUB_REPO } from "@/lib/downloads";

/**
 * Pricing. Credits are the unit because a run's cost is dominated by model
 * usage, and the five stages differ wildly in what they consume: a research
 * pass with live web search costs far more than a brainstorm.
 */

type Plan = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Enough to take one real idea through the whole pipeline.",
    features: [
      "$5 in credits, once",
      "All five agents, no stages held back",
      "Bring your own Anthropic key for unlimited runs",
      "Every generated file is yours to keep",
    ],
  },
  {
    name: "Plus",
    price: "$14",
    cadence: "per month",
    blurb: "For validating a steady stream of ideas.",
    popular: true,
    features: [
      "$14 in credits monthly",
      "Run history kept across sessions",
      "Longer research passes and larger builds",
      "Priority model capacity",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    blurb: "For people shipping, not just exploring.",
    features: [
      "$29 in credits monthly",
      "Deeper simulation panels",
      "Multi-file builds beyond one screen",
      "Export a run as a brief",
    ],
  },
  {
    name: "Max",
    price: "$99",
    cadence: "per month",
    blurb: "For teams putting every idea through the gate.",
    features: [
      "$99 in credits monthly",
      "Highest model tier on every stage",
      "Seats for the whole team",
      "Direct support",
    ],
  },
];

function Check() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-[3px] shrink-0"
    >
      <path
        d="M3 8.4 6.2 11.6 13 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Pricing() {
  const cta = RELEASES_PUBLISHED
    ? `https://github.com/${GITHUB_REPO}/releases/latest`
    : "#faq";

  return (
    <section id="pricing" className="relative scroll-mt-28 px-6 py-24 sm:px-10">
      <div
        aria-hidden="true"
        className="dot-field dots-crawl pointer-events-none absolute left-1/2 top-0 h-[420px] w-[620px] -translate-x-1/2 opacity-[0.4] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_35%,black,transparent_72%)]"
      />

      <div className="relative mx-auto max-w-[68rem]">
        <div className="text-center">
          <h2 className="display mx-auto text-[1.75rem] sm:text-[2.5rem]">
            Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-[42ch] text-[14.5px] leading-[1.65] text-chalk-soft">
            Start free. Credits cover the model usage a run consumes, and you
            can always point the app at your own Anthropic key instead.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`relative flex flex-col rounded-[18px] border p-6 transition-colors duration-200 ${
                p.popular
                  ? "border-edge-strong bg-void-3"
                  : "border-edge bg-void-2 hover:border-edge-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-medium text-chalk">{p.name}</h3>
                {p.popular && (
                  <span className="rounded-full bg-chalk px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.09em] text-void">
                    Popular
                  </span>
                )}
              </div>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="display text-[2.5rem] text-chalk">
                  {p.price}
                </span>
                <span className="text-[12.5px] text-chalk-faint">
                  {p.cadence}
                </span>
              </p>

              <p className="mt-3 min-h-[2.6rem] text-[12.5px] leading-[1.55] text-chalk-soft">
                {p.blurb}
              </p>

              <a
                href={cta}
                className={`spring-hover mt-5 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium ${
                  p.popular
                    ? "bg-chalk text-void"
                    : "border border-edge-strong text-chalk-soft hover:text-chalk"
                }`}
              >
                {p.name === "Free" ? "Get started" : `Choose ${p.name}`}
              </a>

              <ul className="mt-6 space-y-2.5 border-t border-edge pt-5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-2.5 text-[12.5px] leading-[1.5] text-chalk-soft"
                  >
                    <span className={p.popular ? "text-signal" : "text-chalk-faint"}>
                      <Check />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-[12px] leading-[1.6] text-chalk-faint">
          Credits are consumed by model usage, so a research-heavy run costs
          more than a quick one. Paid plans are not live yet; the app is free to
          download and runs on your own key today.
        </p>
      </div>
    </section>
  );
}
