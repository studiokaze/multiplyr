"use client";

import { Component, type ReactNode } from "react";
import { WORLD_PATH } from "@/lib/worldland";

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
type FlowNode = { y: number; h: number; cursor: number };

/** Pure layout, outside render: mutation is fine in a plain function. */
function flowLayout(
  shares: number[],
  usable: number,
  gap: number,
  total: number,
): FlowNode[] {
  const out: FlowNode[] = [];
  let y = 8;
  for (const v of shares) {
    const h = Math.max(14, (usable * v) / total);
    out.push({ y, h, cursor: y });
    y += h + gap;
  }
  return out;
}

function flowLinks(
  left: FlowNode[],
  right: FlowNode[],
  pulls: number[],
  sTotal: number,
  x0: number,
  x1: number,
): { d: string; w: number }[] {
  const links: { d: string; w: number }[] = [];
  const mx = (x0 + x1) / 2;
  for (const r of left) {
    right.forEach((sNode, j) => {
      const w = Math.max(1.5, r.h * (pulls[j] / sTotal));
      const sy = r.cursor + w / 2;
      const ty = sNode.cursor + w / 2;
      r.cursor += w;
      sNode.cursor += w;
      links.push({
        d: `M ${x0} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${x1} ${ty}`,
        w,
      });
    });
  }
  return links;
}

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

  const leftNodes = flowLayout(
    regions.map((r) => num(r.share)),
    usable,
    GAP,
    rTotal,
  );
  const rightNodes = flowLayout(
    segments.map((x) => num(x.pull)),
    usable,
    GAP,
    sTotal,
  );
  const left = regions.map((r, i) => ({ ...r, ...leftNodes[i] }));
  const right = segments.map((x, i) => ({ ...x, ...rightNodes[i] }));

  const x0 = LABEL + NODE_W;
  const x1 = W - LABEL - NODE_W;
  const links = flowLinks(
    leftNodes,
    rightNodes,
    segments.map((x) => num(x.pull)),
    sTotal,
    x0,
    x1,
  ).map((l, i) => ({ ...l, key: `${i}` }));

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
 * The demographics map: the real world silhouette (generated from public
 * geodata, equirectangular, Antarctica cropped) with demand as glowing
 * markers at region anchors — sized by share, labelled in the corner.
 */
const REGION_ANCHORS: { match: RegExp; label: string; x: number; y: number }[] =
  [
    { match: /north.?america|usa?|united states|canada|mexico/i, label: "North America", x: 80, y: 41 },
    { match: /south.?america|latin|brazil|latam/i, label: "South America", x: 122, y: 95 },
    { match: /europe|uk|germany|france/i, label: "Europe", x: 195, y: 33 },
    { match: /africa|mena|middle.?east/i, label: "Africa", x: 200, y: 78 },
    { match: /asia|india|china|japan|apac|pacific/i, label: "Asia", x: 275, y: 45 },
    { match: /oceania|australia|new zealand/i, label: "Oceania", x: 314, y: 108 },
  ];

export function DemandMap({
  regions,
}: {
  regions: { region: string; share: number }[];
}) {
  if (!regions?.length) return null;
  const shareFor = (a: (typeof REGION_ANCHORS)[number]) =>
    regions
      .filter((r) => a.match.test(String(r.region)))
      .reduce((s, r) => s + num(r.share), 0);
  const max = Math.max(...REGION_ANCHORS.map(shareFor), 1);

  return (
    <svg
      viewBox="0 0 360 148"
      className="w-full"
      role="img"
      aria-label="Demand by region on the world map"
    >
      <path
        d={WORLD_PATH}
        fill="var(--sunk)"
        stroke="var(--rule-strong)"
        strokeWidth={0.4}
      />
      {REGION_ANCHORS.map((a, i) => {
        const v = shareFor(a);
        if (v <= 0) return null;
        const r = 4 + 14 * Math.sqrt(v / max);
        return (
          <g key={a.label} className="map-region" style={{ animationDelay: `${i * 120}ms` }}>
            <circle cx={a.x} cy={a.y} r={r} fill="var(--build)" fillOpacity={0.16} />
            <circle cx={a.x} cy={a.y} r={r * 0.55} fill="var(--build)" fillOpacity={0.3} />
            <circle cx={a.x} cy={a.y} r={2.4} fill="var(--build)">
              <title>{`${a.label}: ~${v}% of demand`}</title>
            </circle>
          </g>
        );
      })}
      {regions.slice(0, 5).map((r, i) => (
        <text
          key={String(r.region)}
          x={6}
          y={104 + i * 9}
          fontSize={6.5}
          fill="var(--ink-faint)"
          fontFamily="var(--font-geist-mono)"
        >
          {String(r.region)} · {num(r.share)}%
        </text>
      ))}
    </svg>
  );
}
