import { RELEASES_PUBLISHED, GITHUB_REPO } from "@/lib/downloads";

/**
 * Pricing. Credits are the unit because a run's cost is dominated by model
 * usage. Copy is kept to the minimum a card needs: name, price, four lines.
 */

type Plan = {
  name: string;
  price: string;
  cadence: string;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    features: [
      "$5 in credits, once",
      "All six agents",
      "Bring your own key",
      "Your files, yours",
    ],
  },
  {
    name: "Plus",
    price: "$14",
    cadence: "per month",
    popular: true,
    features: [
      "$14 in credits monthly",
      "Run history",
      "Longer research passes",
      "Priority capacity",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "per month",
    features: [
      "$29 in credits monthly",
      "Deeper simulations",
      "Larger builds",
      "Export runs as briefs",
    ],
  },
  {
    name: "Max",
    price: "$99",
    cadence: "per month",
    features: [
      "$99 in credits monthly",
      "Highest model tier",
      "Team seats",
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
    <section id="pricing" className="relative scroll-mt-28 px-6 py-14 sm:px-10">
      <div className="relative mx-auto max-w-[68rem]">
        <div className="text-center">
          <h2 className="brand mx-auto text-[1.3rem] sm:text-[1.9rem]">
            Pricing
          </h2>
          <p className="mx-auto mt-4 text-[14.5px] text-chalk-soft">
            Start free. Or run on your own Anthropic key.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`plan-card relative flex flex-col rounded-[18px] border p-6 ${
                p.popular
                  ? "border-edge-strong bg-void-3"
                  : "border-edge bg-void-2"
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

              <a
                href={cta}
                className={`spring-hover mt-6 flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium ${
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

        <p className="mt-8 text-center text-[12px] text-chalk-faint">
          Paid plans are not live yet. The app is free on your own key today.
        </p>
      </div>
    </section>
  );
}
