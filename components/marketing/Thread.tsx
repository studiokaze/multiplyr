/**
 * The connective tissue between sections: a hairline with a signal pulse
 * travelling down it, plus a node where it meets the next section.
 *
 * This is the site's own motif rather than a borrowed one — the product is a
 * pipeline that hands each stage's output to the next, and the page carries
 * that same thread down its spine. Purely ambient: no scroll coupling, no
 * reveal, just a slow continuous transit.
 */
export default function Thread({
  height = 120,
  delay = 0,
  duration = 4.5,
}: {
  height?: number;
  /** Offsets each instance so the page never pulses in unison. */
  delay?: number;
  duration?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto w-px"
      style={{ height }}
    >
      {/* the rail, fading out at both ends so it never reads as a border */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-edge-strong to-transparent" />

      {/* the travelling signal */}
      <div
        className="thread-pulse absolute left-1/2 h-[46px] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-signal to-transparent"
        style={
          {
            "--t": `${duration}s`,
            "--d": `${delay}ms`,
          } as React.CSSProperties
        }
      />

      {/* the node it arrives at */}
      <div className="absolute -bottom-[3px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-full border border-edge-strong bg-void" />
    </div>
  );
}
