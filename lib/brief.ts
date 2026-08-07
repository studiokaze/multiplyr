import type {
  AnalysisResult,
  Framing,
  GeneratedFile,
  MarketingResult,
  ResearchResult,
  SimulationResult,
} from "@/lib/types";

/**
 * A run, flattened into a markdown brief someone could hand to a cofounder.
 * Sections appear only if their stage actually produced a result — a brief
 * never pretends a stage ran.
 */
export function buildBrief(run: {
  idea: string;
  framing: Framing | null;
  research: ResearchResult | null;
  analysis: AnalysisResult | null;
  simulation: SimulationResult | null;
  files: GeneratedFile[];
  marketing: MarketingResult | null;
}): string {
  const { idea, framing, research, analysis, simulation, files, marketing } =
    run;
  const lines: string[] = [
    `# Multiplyer run brief`,
    ``,
    `**Idea:** ${idea}`,
    ``,
  ];

  if (framing) {
    lines.push(
      `## Framing`,
      ``,
      `**Angle:** ${framing.angle}`,
      `**Target user:** ${framing.targetUser}`,
      `**Problem:** ${framing.problem}`,
      ``,
    );
  }

  if (research) {
    lines.push(`## Research`, ``);
    if (research.competitors.length) {
      lines.push(`### Competitors`, ``);
      for (const c of research.competitors) {
        lines.push(`- **${c.name}** — ${c.whatTheyDo} Weakness: ${c.weakness}`);
      }
      lines.push(``);
    }
    if (research.demandSignals.length) {
      lines.push(`### Demand signals`, ``);
      for (const s of research.demandSignals) {
        lines.push(`- [${s.strength}] ${s.signal}`);
      }
      lines.push(``);
    }
    if (research.gaps.length) {
      lines.push(`### Gaps`, ``);
      for (const g of research.gaps) lines.push(`- ${g}`);
      lines.push(``);
    }
    if (research.demandByRegion?.length) {
      lines.push(`### Demand by region (estimated)`, ``);
      for (const r of research.demandByRegion) {
        lines.push(`- ${r.region}: ~${r.share}%`);
      }
      lines.push(``);
    }
    if (research.monthlyInterest?.length) {
      lines.push(
        `### Interest, last 12 months (estimated)`,
        ``,
        research.monthlyInterest.map((m) => `${m.month} ${m.interest}`).join(" · "),
        ``,
      );
    }
  }

  if (analysis) {
    lines.push(
      `## Verdict`,
      ``,
      `**${analysis.verdict.toUpperCase()}** — ${analysis.score}/10`,
      ``,
      analysis.reasoning,
      ``,
      `### Key risks`,
      ``,
    );
    analysis.keyRisks.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
    lines.push(``);
    if (analysis.aspects) {
      const a = analysis.aspects;
      lines.push(
        `### The idea, ranked (0-100)`,
        ``,
        `| Demand | Openness | Feasibility | Willingness to pay | Timing |`,
        `| --- | --- | --- | --- | --- |`,
        `| ${a.demand} | ${a.openness} | ${a.feasibility} | ${a.willingnessToPay} | ${a.timing} |`,
        ``,
      );
    }
    if (analysis.niches?.length) {
      lines.push(
        `### Niche map`,
        ``,
        `| Niche | Demand | Crowding | Note |`,
        `| --- | --- | --- | --- |`,
      );
      for (const n of analysis.niches) {
        const name = n.name === analysis.bestNiche ? `**${n.name}**` : n.name;
        lines.push(`| ${name} | ${n.demand} | ${n.crowding} | ${n.note} |`);
      }
      lines.push(``);
    }
  }

  if (simulation) {
    lines.push(
      `## Simulation`,
      ``,
      `Panel of ${simulation.panelSize} from the segment: ` +
        `**${simulation.wouldAdopt} would adopt**, ${simulation.unsure} unsure, ` +
        `${simulation.wouldNot} would not.`,
      ``,
      `**Strongest objection:** ${simulation.strongestObjection}`,
      ``,
    );
    if (simulation.objections.length) {
      lines.push(`### Objections`, ``);
      for (const o of simulation.objections) {
        lines.push(`- [${o.severity}] ${o.objection}`);
      }
      lines.push(``);
    }
    if (simulation.adjustments.length) {
      lines.push(`### Would flip the unsure`, ``);
      for (const a of simulation.adjustments) lines.push(`- ${a}`);
      lines.push(``);
    }
  }

  if (files.length) {
    lines.push(
      `## Build`,
      ``,
      `${files.length} file(s) generated:`,
      ``,
      ...files.map((f) => `- \`${f.path}\``),
      ``,
    );
  }

  if (marketing) {
    lines.push(
      `## Launch`,
      ``,
      `**Positioning:** ${marketing.positioning}`,
      ``,
      `Copy answers: ${marketing.answeredObjection}`,
      ``,
    );
    for (const p of marketing.posts) {
      const platform =
        p.platform === "x"
          ? "X"
          : p.platform === "linkedin"
            ? "LinkedIn"
            : "Reddit";
      lines.push(`### ${platform} (${p.where})`, ``, p.content, ``);
    }
    lines.push(`### Channels`, ``);
    for (const c of marketing.channels) lines.push(`- ${c}`);
    lines.push(``);
  }

  return lines.join("\n");
}

/** Filename-safe slug of the idea, for the exported brief. */
export function briefFilename(idea: string): string {
  const slug =
    idea
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "run";
  return `multiplyer-brief-${slug}.md`;
}
