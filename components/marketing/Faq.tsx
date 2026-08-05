/**
 * FAQ, accordion-style via native <details> — no JS, keyboard-accessible for
 * free. Answers are honest about how the product actually works today.
 */

const QA: { q: string; a: string }[] = [
  {
    q: "What is Multiplyer?",
    a: "A desktop workspace that runs your idea through six agents in order — brainstorm, research, analysis, simulation, build, marketing — so what gets built is the version the earlier stages justified.",
  },
  {
    q: "How is it different from other AI builders?",
    a: "Most builders go straight from prompt to code. Multiplyer does the thinking first, and carries it into the build.",
  },
  {
    q: "What do I need to run it?",
    a: "Your own Anthropic API key. It is stored in your OS keychain, never in the binary.",
  },
  {
    q: "What does it cost?",
    a: "The app is free. You pay Anthropic directly for what your runs consume. No markup.",
  },
  {
    q: "Where does my idea go?",
    a: "To Anthropic's API and nowhere else. No account, no middleman server, no analytics.",
  },
  {
    q: "Which platforms are supported?",
    a: "Windows, macOS and Linux, built in public by GitHub Actions.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-28 px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-[46rem]">
        <div className="text-center">
          <h2 className="display mx-auto text-[1.75rem] sm:text-[2.5rem]">
            Questions, answered plainly.
          </h2>
        </div>

        <div className="sheen relative mt-10 grid gap-px overflow-hidden rounded-[14px] border border-edge bg-edge" style={{ "--t": "11s" } as React.CSSProperties}>
          {QA.map(({ q, a }) => (
            // Sharing a `name` makes the group exclusive natively: opening
            // one question closes whichever other one was open. No JS.
            <details key={q} name="faq" className="group bg-void-2">
              <summary className="relative flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[15px] font-medium text-chalk-soft hover:text-chalk [&::-webkit-details-marker]:hidden group-open:text-chalk">
                <span>{q}</span>
                <span
                  aria-hidden="true"
                  className="faq-mark relative h-3 w-3 shrink-0 text-chalk-faint"
                >
                  <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                  <span className="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>
              {/* grid 0fr -> 1fr so the row eases open without measuring height */}
              <div className="faq-body">
                <div>
                  <p className="faq-answer px-6 pb-6 text-[14px] leading-[1.65] text-chalk-soft">
                    {a}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
