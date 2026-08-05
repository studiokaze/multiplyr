"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-linked marquee: rows of huge type that slide horizontally as the
 * page scrolls vertically, alternate rows moving in opposite directions.
 * Driven directly by window.scrollY (no animation library — one passive
 * scroll listener, one rAF), so it only moves when the page does.
 *
 * Each row renders its words twice and wraps with a modulo, so the loop is
 * seamless in both directions at any scroll position.
 */

const LINES: { text: string; reverse: boolean }[] = [
  { text: "Brainstorm", reverse: false },
  { text: "Validate", reverse: true },
  { text: "Build", reverse: false },
  { text: "Market", reverse: true },
];

/** px of horizontal travel per px of vertical scroll */
const SPEED = 0.32;
const COPIES = 8;

export default function TextScroll() {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        // Half the content = one full copy set; wrap within it.
        const half = row.scrollWidth / 2;
        if (half <= 0) return;
        const dir = LINES[i].reverse ? 1 : -1;
        const raw = y * SPEED * dir + i * 160;
        const x = -(((raw % half) + half) % half);
        row.style.transform = `translate3d(${x}px, 0, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section aria-hidden="true" className="overflow-x-clip py-10 select-none">
      {LINES.map((line, i) => (
        <div key={line.text} className="overflow-hidden">
          <div
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="display flex w-max whitespace-nowrap text-[17vw] leading-[0.98] tracking-[-0.02em] uppercase will-change-transform sm:text-[9.5rem]"
          >
            {Array.from({ length: COPIES * 2 }, (_, k) => (
              <span
                key={k}
                className={`pr-[0.55em] ${k % 2 === 0 ? "word-solid" : "word-outline"}`}
              >
                {line.text}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
