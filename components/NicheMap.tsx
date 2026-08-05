"use client";

import { useState } from "react";
import type { Niche } from "@/lib/types";

/**
 * The market map: every niche the analysis found, plotted demand (y) against
 * crowding (x). The top-left quadrant is the opening — people want it and
 * nobody serves them well — so that corner is tinted and everything else is
 * left plain. Hovering a point pins its detail.
 *
 * Deliberately not a generic scatter chart: the quadrant is the argument, and
 * the axes are labelled in words a founder would use rather than as numbers.
 */
export default function NicheMap({
  niches,
  best,
}: {
  niches: Niche[];
  best?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!niches?.length) return null;

  const active =
    niches.find((n) => n.name === hovered) ??
    niches.find((n) => n.name === best) ??
    niches[0];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">Where the opening is</span>
        <span className="label">{niches.length} slices</span>
      </div>

      <div className="mt-2.5 overflow-hidden rounded-[8px] border border-rule bg-surface">
        <div className="relative aspect-[4/3] w-full">
          {/* the opening: high demand, low crowding */}
          <div className="absolute left-0 top-0 h-1/2 w-1/2 bg-build/[0.06]" />
          <div className="absolute left-2 top-2 font-mono text-[8px] uppercase tracking-[0.09em] text-build/70">
            The opening
          </div>

          {/* quadrant rules */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-rule" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-rule" />

          {niches.map((n) => {
            const isActive = n.name === active.name;
            const isBest = n.name === best;
            return (
              <button
                key={n.name}
                onMouseEnter={() => setHovered(n.name)}
                onFocus={() => setHovered(n.name)}
                onMouseLeave={() => setHovered(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 p-2"
                style={{
                  left: `${n.crowding}%`,
                  top: `${100 - n.demand}%`,
                }}
                title={`${n.name}: demand ${n.demand}, crowding ${n.crowding}`}
              >
                <span
                  className={`block rounded-full transition-all duration-200 ${
                    isBest
                      ? "h-[11px] w-[11px] bg-build ring-4 ring-build/15"
                      : isActive
                        ? "h-[10px] w-[10px] bg-ink"
                        : "h-[8px] w-[8px] bg-ink-faint"
                  }`}
                />
              </button>
            );
          })}

          {/* axis labels, in founder language rather than numbers */}
          <span className="absolute bottom-1.5 left-2 font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
            Unserved
          </span>
          <span className="absolute bottom-1.5 right-2 font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
            Crowded
          </span>
          <span className="absolute right-2 top-2 font-mono text-[8px] uppercase tracking-[0.09em] text-ink-faint">
            Wanted
          </span>
        </div>

        {/* pinned detail for whichever point is active */}
        <div className="border-t border-rule bg-sunk px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-medium text-ink">
              {active.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-ink-faint">
              {active.demand} want · {active.crowding} served
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-soft">
            {active.note}
          </p>
        </div>
      </div>

      {/* the ranked list, so the map is readable without hovering */}
      <ul className="mt-2.5 space-y-1">
        {[...niches]
          .sort((a, b) => b.demand - b.crowding - (a.demand - a.crowding))
          .map((n) => (
            <li
              key={n.name}
              onMouseEnter={() => setHovered(n.name)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center justify-between gap-3 rounded-[5px] px-2 py-1.5 text-[12px] transition-colors duration-150 ${
                n.name === active.name ? "bg-sunk text-ink" : "text-ink-soft"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                {n.name === best && (
                  <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-build" />
                )}
                <span className="truncate">{n.name}</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                {n.demand - n.crowding > 0 ? "+" : ""}
                {n.demand - n.crowding}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
