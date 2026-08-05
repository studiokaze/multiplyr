import Backdrop from "./Backdrop";
import ClosingCta from "./ClosingCta";
import Faq from "./Faq";
import Features from "./Features";
import Footer from "./Footer";
import Hero from "./Hero";
import MarketingNav from "./MarketingNav";
import Pricing from "./Pricing";
import WorkspaceShot from "./WorkspaceShot";

export default function Marketing() {
  return (
    // overflow-x-CLIP, not -hidden: hidden makes this div the scroll container
    // for position:sticky descendants (which then never pin, because the body
    // is what actually scrolls). clip clips the off-edge backdrop patches the
    // same way without creating a scroll container.
    <div id="top" className="marketing relative flex-1 overflow-x-clip">
      <MarketingNav />

      {/* Pitch black page; the backdrop's motion is the only thing on it. */}
      <Backdrop />

      <main className="relative">
        <Hero />

        <section className="px-6 pb-8 sm:px-10">
          {/* Final beat of the hero entrance (label 1, words 2-8, subhead 9,
              CTA 10, chips 11 — the shot lands last). */}
          <div
            className="enter mx-auto max-w-[72rem]"
            style={{ "--stagger": 12 } as React.CSSProperties}
          >
            <WorkspaceShot />
          </div>
        </section>

        <Features />
        <Pricing />
        <Faq />
        <ClosingCta />
        <Footer />
      </main>
    </div>
  );
}
