/**
 * FAQ, accordion-style via native <details> — no JS, keyboard-accessible for
 * free. Answers are honest about how the product actually works today.
 */

const QA: { q: string; a: string }[] = [
  {
    q: "What is Multiplyr?",
    a: "A desktop workspace that takes an idea through five agents in order — brainstorm, research, market analysis, simulation, build — so the thing that gets built is the version of the idea the earlier stages justified.",
  },
  {
    q: "How is it different from other AI builders?",
    a: "Most builders go straight from your prompt to code. Multiplyr does the work you would do before writing code — sharpening the framing, checking who else exists, weighing demand, pressure-testing on your segment — and carries that context into the build, in one place.",
  },
  {
    q: "What do I need to run it?",
    a: "Your own Anthropic API key. The app asks for it on first launch and stores it in your operating system's keychain. Nothing is bundled in the binary.",
  },
  {
    q: "What does it cost?",
    a: "The app is a free download. You pay Anthropic directly for the model usage your runs consume — there is no markup and no subscription.",
  },
  {
    q: "Where does my idea go?",
    a: "To Anthropic's API, and nowhere else. There is no account, no server of ours in the middle, and no analytics on what you type. Session state lives in your browser storage.",
  },
  {
    q: "Which platforms are supported?",
    a: "Windows, macOS (Apple silicon and Intel) and Linux, as direct downloads. Builds are produced in public by GitHub Actions from tagged commits.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-28 px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-[46rem]">
        <div className="text-center">
          <h2 className="display mx-auto text-[1.75rem] sm:text-[2.5rem]">
            Questions, answered plainly.
          </h2>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-[14px] border border-edge bg-edge">
          {QA.map(({ q, a }) => (
            <details key={q} className="group bg-void-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-[15px] font-medium text-chalk-soft hover:bg-void-3 hover:text-chalk [&::-webkit-details-marker]:hidden group-open:text-chalk">
                {q}
                <span
                  aria-hidden="true"
                  className="relative h-3 w-3 shrink-0 text-chalk-faint"
                >
                  <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                  <span className="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-200 group-open:scale-y-0" />
                </span>
              </summary>
              <p className="px-6 pb-6 text-[14px] leading-[1.65] text-chalk-soft">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
