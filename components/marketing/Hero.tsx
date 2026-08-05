"use client";

import DownloadCTA from "./DownloadCTA";

/**
 * The page's only entrance animation. The headline enters word by word —
 * each word pulls into focus with a slight rise — then the subhead, CTA and
 * stage chips follow, one beat each, in reading order. Below this section,
 * nothing ever animates in.
 */
const HEADLINE = ["Jarvis", "for", "apps"];

function at(stagger: number): React.CSSProperties {
  return { "--stagger": stagger } as React.CSSProperties;
}

export default function Hero() {
  // Beats: words are 1..n, then subhead, CTA, chips.
  const afterWords = HEADLINE.length;

  return (
    <section className="relative px-6 pb-14 pt-36 sm:px-10 sm:pt-40">
      <div className="mx-auto max-w-[62rem] text-center">
        <h1 className="brand mx-auto max-w-[17ch] text-[1.9rem] text-chalk sm:text-[3.4rem]">
          {HEADLINE.map((word, i) => (
            <span key={i} className="hero-word" style={at(1 + i)}>
              {word}
            </span>
          ))}
        </h1>

        <p
          className="enter mx-auto mt-7 max-w-[54ch] text-[16px] leading-[1.65] text-chalk-soft sm:text-[17px]"
          style={at(afterWords + 1)}
        >
          Six agents, one workspace. Your idea is sharpened, researched,
          weighed, pressure-tested, built, then marketed.
        </p>

        <div className="enter mt-10" style={at(afterWords + 2)}>
          <DownloadCTA />
        </div>

      </div>
    </section>
  );
}
