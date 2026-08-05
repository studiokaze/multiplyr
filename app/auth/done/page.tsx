import type { Metadata } from "next";
import { MarkGlyph } from "@/components/marketing/Mark";

export const metadata: Metadata = {
  title: "You're in",
  robots: { index: false },
};

/** The hand-back: web auth is finished, the app takes over from here. */
export default function AuthDonePage() {
  return (
    <div className="marketing flex flex-1 items-center justify-center bg-void px-6 py-16">
      <div className="w-full max-w-[24rem] text-center">
        <span className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border border-edge bg-void-2">
          <MarkGlyph size={36} className="text-chalk" />
        </span>

        <h1 className="brand mt-8 text-[1.3rem] text-chalk">You're in</h1>
        <p className="mx-auto mt-3 max-w-[30ch] text-[13.5px] leading-[1.65] text-chalk-soft">
          That's everything on the web. Head back to the app.
        </p>

        <a
          href="multiplyer://signed-in"
          className="cta-primary mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold"
        >
          Open Multiplyer
        </a>
        <p className="mt-4 text-[11.5px] text-chalk-faint">
          Opens automatically if the app is installed. You can close this tab.
        </p>
      </div>
    </div>
  );
}
