"use client";

import { Component, type ReactNode } from "react";

/**
 * The research handout's charts. Hand-rolled SVG on the app's own tokens —
 * no chart library, so they animate exactly as designed and weigh nothing.
 * Data is estimated by the research agent from live evidence and labelled
 * that way; the charts' job is to make the shape of demand legible.
 *
 * Every chart renders inside ChartSafe: model-shaped data is never fully
 * trusted, and a bad value must cost one chart, not the whole panel.
 */

export class ChartSafe extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

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
  const max = Math.max(...data.map((d) => num(d.interest)), 1);
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
        const h = Math.max(2, innerH * (num(d.interest) / 100));
        const x = PAD.left + i * (barW + gap);
        const isPeak = num(d.interest) === max;
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
              <title>{`${String(d.month)}: ${num(d.interest)}/100`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={H - 7}
              textAnchor="middle"
              fontSize={7.5}
              fill="var(--ink-faint)"
              fontFamily="var(--font-geist-mono)"
            >
              {String(d.month).slice(0, 3)}
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

  const rTotal = regions.reduce((s, r) => s + num(r.share), 0) || 1;
  const sTotal = segments.reduce((s, x) => s + num(x.pull), 0) || 1;
  const usable = H - 16 - GAP * (Math.max(regions.length, segments.length) - 1);

  // Node vertical layout, proportional heights.
  let y = 8;
  const left = regions.map((r) => {
    const h = Math.max(14, (usable * num(r.share)) / rTotal);
    const node = { ...r, y, h, cursor: y };
    y += h + GAP;
    return node;
  });
  y = 8;
  const right = segments.map((s) => {
    const h = Math.max(14, (usable * num(s.pull)) / sTotal);
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
      const w = Math.max(1.5, r.h * (num(s.pull) / sTotal));
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

const AXES = [
  { key: "demand", label: "Demand" },
  { key: "openness", label: "Openness" },
  { key: "feasibility", label: "Feasibility" },
  { key: "willingnessToPay", label: "Pays" },
  { key: "timing", label: "Timing" },
] as const;

/**
 * The idea ranked across five axes: a radar whose area sweeps in. Verdict
 * colour carries the fill so the shape reads with the verdict, not against it.
 */
export function AspectRadar({
  aspects,
  tone,
}: {
  aspects: Record<string, number>;
  tone: "build" | "iterate" | "kill";
}) {
  if (!aspects) return null;
  const S = 220;
  const C = S / 2;
  const R = 74;
  const color = `var(--${tone})`;

  const point = (i: number, r: number): [number, number] => {
    const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };

  const ring = (t: number) =>
    AXES.map((_, i) => point(i, R * t).join(",")).join(" ");
  const area = AXES.map((ax, i) =>
    point(i, (R * Math.min(100, Math.max(0, num(aspects[ax.key])))) / 100).join(
      ",",
    ),
  ).join(" ");

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="mx-auto w-full max-w-[240px]"
      role="img"
      aria-label="Idea ranked across five aspects"
    >
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <polygon
          key={t}
          points={ring(t)}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={t === 1 ? 1.2 : 0.7}
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, R);
        return (
          <line
            key={i}
            x1={C}
            y1={C}
            x2={x}
            y2={y}
            stroke="var(--rule)"
            strokeWidth={0.7}
          />
        );
      })}
      <polygon
        points={area}
        fill={color}
        fillOpacity={0.16}
        stroke={color}
        strokeWidth={1.6}
        className="radar-area"
      />
      {AXES.map((ax, i) => {
        const v = Math.min(100, Math.max(0, num(aspects[ax.key])));
        const [px, py] = point(i, (R * v) / 100);
        const [lx, ly] = point(i, R + 16);
        return (
          <g key={ax.key}>
            <circle cx={px} cy={py} r={2.6} fill={color}>
              <title>{`${ax.label}: ${v}/100`}</title>
            </circle>
            <text
              x={lx}
              y={ly + 3}
              textAnchor="middle"
              fontSize={8}
              fill="var(--ink-soft)"
            >
              {ax.label}
            </text>
            <text
              x={lx}
              y={ly + 13}
              textAnchor="middle"
              fontSize={7.5}
              fill="var(--ink-faint)"
              fontFamily="var(--font-geist-mono)"
            >
              {v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * The demographics map: a deliberately low-poly world, continent blobs lit
 * by demand share. Continent granularity is what the research actually
 * knows, so the map draws exactly that — no fake country precision.
 */
const CONTINENTS: { key: string; label: string; d: string; match: RegExp }[] = [
  {
    key: "na",
    label: "North America",
    match: /north.?america|\busa?\b|united states|canada|mexico/i,
    d: "M28 34 L58 22 L92 26 L96 42 L82 52 L72 70 L58 78 L48 64 L34 54 Z",
  },
  {
    key: "sa",
    label: "South America",
    match: /south.?america|latin|brazil|latam/i,
    d: "M72 84 L90 80 L100 96 L92 122 L78 130 L70 108 Z",
  },
  {
    key: "eu",
    label: "Europe",
    match: /europe|\buk\b|germany|france/i,
    d: "M140 28 L166 22 L178 34 L168 48 L148 52 L138 40 Z",
  },
  {
    key: "af",
    label: "Africa",
    match: /africa|mena|middle.?east/i,
    d: "M142 58 L170 54 L182 72 L174 100 L156 112 L144 88 Z",
  },
  {
    key: "as",
    label: "Asia",
    match: /asia|india|china|japan|pacific|apac/i,
    d: "M182 26 L228 20 L262 34 L256 58 L232 72 L204 64 L186 46 Z",
  },
  {
    key: "oc",
    label: "Oceania",
    match: /oceania|australia|new zealand/i,
    d: "M238 94 L262 90 L270 104 L256 116 L240 110 Z",
  },
];

export function DemandMap({
  regions,
}: {
  regions: { region: string; share: number }[];
}) {
  if (!regions?.length) return null;
  const share = (c: (typeof CONTINENTS)[number]) =>
    regions
      .filter((r) => c.match.test(String(r.region)))
      .reduce((s, r) => s + num(r.share), 0);
  const max = Math.max(...CONTINENTS.map(share), 1);

  return (
    <svg
      viewBox="0 0 290 140"
      className="w-full"
      role="img"
      aria-label="Demand by region"
    >
      {CONTINENTS.map((c, i) => {
        const v = share(c);
        const lit = v > 0;
        return (
          <path
            key={c.key}
            d={c.d}
            className="map-region"
            style={{ animationDelay: `${i * 90}ms` }}
            fill={lit ? "var(--build)" : "var(--sunk)"}
            fillOpacity={lit ? 0.15 + 0.85 * (v / max) : 1}
            stroke={lit ? "var(--build)" : "var(--rule-strong)"}
            strokeOpacity={lit ? 0.8 : 1}
            strokeWidth={1}
            strokeLinejoin="round"
          >
            <title>{lit ? `${c.label}: ~${v}% of demand` : c.label}</title>
          </path>
        );
      })}
      {regions.slice(0, 5).map((r, i) => (
        <text
          key={String(r.region)}
          x={8}
          y={14 + i * 11}
          fontSize={7.5}
          fill="var(--ink-faint)"
          fontFamily="var(--font-geist-mono)"
        >
          {String(r.region)} · {num(r.share)}%
        </text>
      ))}
    </svg>
  );
}
