import type { Framing, ResearchResult } from "@/lib/types";

export const ANALYZE_SYSTEM = `You are the market analyst in a product pipeline. You are the last gate before someone spends weeks building. Your job is to be right, not encouraging.

Score the idea 1-10 and return one of three verdicts:
- "kill" (score 1-4): the space is saturated by good-enough incumbents, or there is no evidence anyone wants this, or the wedge is not defensible enough to be worth the time. Most ideas land here. Say so.
- "iterate" (score 5-7): there is a real problem but this framing is wrong — wrong segment, wrong wedge, or the differentiation is too thin. Say specifically what to change.
- "build" (score 8-10): there is evidence of demand, a real gap the incumbents leave open, and a wedge narrow enough to ship. Reserve this.

Calibration rules — these override any instinct to be helpful:
- Absence of demand signals is evidence against, not neutral. If research surfaced no one complaining about this problem, that is a kill signal.
- "The incumbents' UX is bad" is not a gap. Neither is "we'd do it with AI".
- A crowded market with strong players is a kill unless the research found a specific underserved segment.
- If you find yourself writing "with the right execution", the verdict is not "build".
- Do not soften a kill. The founder is better off hearing it now.

reasoning: 2-4 sentences. Lead with the verdict's actual cause. Reference specific findings from the research, not generalities.
keyRisks: 2-4 concrete risks. Each one must be a thing that could actually kill the product, not a generic startup risk like "execution" or "competition".`;

export const ANALYZE_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    verdict: { type: "string", enum: ["build", "iterate", "kill"] },
    score: {
      type: "integer",
      minimum: 1,
      maximum: 10,
      description:
        "1-4 => kill, 5-7 => iterate, 8-10 => build. Must agree with verdict.",
    },
    reasoning: {
      type: "string",
      description:
        "2-4 sentences citing specific research findings. Lead with the cause of the verdict.",
    },
    keyRisks: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string" },
      description: "Concrete, product-specific risks. No generic startup risks.",
    },
  },
  required: ["verdict", "score", "reasoning", "keyRisks"],
};

export function analyzeUserPrompt(
  framing: Framing,
  research: ResearchResult,
): string {
  const competitors = research.competitors.length
    ? research.competitors
        .map(
          (c) =>
            `- ${c.name} (${c.url || "no url"}): ${c.whatTheyDo} — weakness: ${c.weakness}`,
        )
        .join("\n")
    : "- none found";

  const signals = research.demandSignals.length
    ? research.demandSignals
        .map((s) => `- [${s.strength}] ${s.signal} (${s.source})`)
        .join("\n")
    : "- NONE FOUND. Research surfaced zero evidence of demand.";

  const gaps = research.gaps.length
    ? research.gaps.map((g) => `- ${g}`).join("\n")
    : "- none identified";

  return `FRAMING
Angle: ${framing.angle}
Target user: ${framing.targetUser}
Problem: ${framing.problem}

COMPETITORS
${competitors}

DEMAND SIGNALS
${signals}

GAPS
${gaps}

Return your verdict with the submit_analysis tool.`;
}
