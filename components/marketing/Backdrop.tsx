/**
 * The backdrop: pitch black with a glossy shine resting on a few portions of
 * the surface — light on piano black. Completely static by request: no
 * keyframes, no drift, nothing to watch. The shine is diagonal and off-axis
 * so it reads as a sheen across the surface, not a spotlight or a wash.
 *
 * Nothing sits below 80% page height: the footer stays pure black.
 */

const SHEENS: { className: string; background: string }[] = [
  // across the hero, upper right — the main highlight
  {
    className: "right-[-12%] top-[-6%] h-[700px] w-[900px] rotate-[14deg]",
    background:
      "radial-gradient(ellipse 60% 45% at 60% 40%, rgba(255, 255, 255, 0.085) 0%, transparent 70%)",
  },
  // a narrow diagonal streak through the workspace shot area
  {
    className: "left-[6%] top-[18%] h-[560px] w-[1100px] rotate-[-11deg]",
    background:
      "linear-gradient(100deg, transparent 34%, rgba(255, 255, 255, 0.05) 50%, transparent 66%)",
  },
  // features, right shoulder
  {
    className: "right-[-8%] top-[42%] h-[620px] w-[760px] rotate-[10deg]",
    background:
      "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(255, 255, 255, 0.06) 0%, transparent 72%)",
  },
  // pricing/FAQ seam, left — the faintest
  {
    className: "left-[-10%] top-[62%] h-[560px] w-[720px] rotate-[-9deg]",
    background:
      "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 72%)",
  },
];

export default function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {SHEENS.map((s, i) => (
        <div
          key={i}
          className={`gloss ${s.className}`}
          style={{ background: s.background }}
        />
      ))}
    </div>
  );
}
