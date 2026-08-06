"use client";

/**
 * The research handout's charts. Hand-rolled SVG on the app's own tokens —
 * no chart library, so they animate exactly as designed and weigh nothing.
 * Data is estimated by the research agent from live evidence and labelled
 * that way; the charts' job is to make the shape of demand legible.
 */

/** 12-month interest curve as animated bars with a peak reference band. */
export function InterestBars({
  data,
}: {
  data: { month: string; interest: number }[];
}) {
  if (!data?.length) return null;
  const W = 340;
  const H = 150;
  const PAD = { top: 14, bottom: 22, left: 8, right: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const gap = 6;
  const barW = (innerW - gap * (data.length - 1)) / data.length;
  const max = Math.max(...data.map((d) => d.interest), 1);
  const peakY = PAD.top + innerH * (1 - max / 100);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Estimated monthly interest"
    >
      {/* grid */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH * t}
          y2={PAD.top + innerH * t}
          stroke="var(--rule)"
          strokeDasharray="3 4"
        />
      ))}
      {/* peak band */}
      <rect
        x={PAD.left}
        y={peakY - 1}
        width={innerW}
        height={10}
        fill="var(--rule)"
        opacity={0.5}
      />
      {data.map((d, i) => {
        const h = Math.max(2, innerH * (d.interest / 100));
        const x = PAD.left + i * (barW + gap);
        const isPeak = d.interest === max;
        return (
          <g key={`${d.month}-${i}`}>
            <rect
              x={x}
              y={PAD.top + innerH - h}
              width={barW}
              height={h}
              rx={2.5}
              className="chart-bar"
              style={{ animationDelay: `${i * 55}ms` }}
              fill={isPeak ? "var(--build)" : "var(--ink-soft)"}
              opacity={isPeak ? 1 : 0.75}
            >
              <title>{`${d.month}: ${d.interest}/100`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={H - 7}
              textAnchor="middle"
              fontSize={7.5}
              fill="var(--ink-faint)"
              fontFamily="var(--font-geist-mono)"
            >
              {d.month.slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

type FlowIn = {
  regions: { region: string; share: number }[];
  segments: { name: string; pull: number }[];
};

/**
 * Demand flow: where it comes from (regions) → who feels it (segments).
 * A two-column sankey with cubic links that draw themselves in; link width
 * apportions each region's share across segments by pull.
 */
export function DemandFlow({ regions, segments }: FlowIn) {
  if (!regions?.length || !segments?.length) return null;
  const W = 340;
  const H = 40 * Math.max(regions.length, segments.length) + 20;
  const NODE_W = 8;
  const GAP = 10;
  const LABEL = 78;

  const rTotal = regions.reduce((s, r) => s + r.share, 0) || 1;
  const sTotal = segments.reduce((s, x) => s + x.pull, 0) || 1;
  const usable = H - 16 - GAP * (Math.max(regions.length, segments.length) - 1);

  // Node vertical layout, proportional heights.
  let y = 8;
  const left = regions.map((r) => {
    const h = Math.max(14, (usable * r.share) / rTotal);
    const node = { ...r, y, h, cursor: y };
    y += h + GAP;
    return node;
  });
  y = 8;
  const right = segments.map((s) => {
    const h = Math.max(14, (usable * s.pull) / sTotal);
    const node = { ...s, y, h, cursor: y };
    y += h + GAP;
    return node;
  });

  const x0 = LABEL + NODE_W;
  const x1 = W - LABEL - NODE_W;
  const links: {
    key: string;
    d: string;
    w: number;
  }[] = [];
  for (const r of left) {
    for (const s of right) {
      // Each region's band splits across segments by pull share.
      const w = Math.max(1.5, r.h * (s.pull / sTotal));
      const sy = r.cursor + w / 2;
      const ty = s.cursor + w / 2;
      r.cursor += w;
      s.cursor += w;
      const mx = (x0 + x1) / 2;
      links.push({
        key: `${r.region}-${s.name}`,
        d: `M ${x0} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${x1} ${ty}`,
        w,
      });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Demand flow from regions to audience segments"
    >
      {links.map((l, i) => (
        <path
          key={l.key}
          d={l.d}
          fill="none"
          stroke="var(--ink-soft)"
          strokeOpacity={0.28}
          strokeWidth={l.w}
          className="chart-link"
          style={{ animationDelay: `${200 + i * 90}ms` }}
        />
      ))}
      {left.map((r) => (
        <g key={r.region}>
          <rect
            x={LABEL}
            y={r.y}
            width={NODE_W}
            height={r.h}
            rx={2}
            fill="var(--ink)"
          />
          <text
            x={LABEL - 6}
            y={r.y + r.h / 2 + 2.5}
            textAnchor="end"
            fontSize={8}
            fill="var(--ink-soft)"
          >
            {r.region}
            <title>{`${r.region}: ${r.share}%`}</title>
          </text>
        </g>
      ))}
      {right.map((s) => (
        <g key={s.name}>
          <rect
            x={W - LABEL - NODE_W}
            y={s.y}
            width={NODE_W}
            height={s.h}
            rx={2}
            fill="var(--build)"
          />
          <text
            x={W - LABEL + 6}
            y={s.y + s.h / 2 + 2.5}
            textAnchor="start"
            fontSize={8}
            fill="var(--ink-soft)"
          >
            {s.name}
            <title>{`${s.name}: ${s.pull}%`}</title>
          </text>
        </g>
      ))}
    </svg>
  );
}
