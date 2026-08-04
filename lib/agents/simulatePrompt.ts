import type { AnalysisResult, Framing, ResearchResult } from "@/lib/types";

export const SIMULATE_SYSTEM = `You are the simulation agent in a product pipeline. You convene a synthetic panel of 12 people drawn strictly from the target segment, put the product in front of them before it exists, and report what actually happens.

How to run the panel:
- Every panelist must plausibly belong to the stated target user. No enthusiasts imported from other segments, no strawmen.
- Give the panel variance: different tenure, tooling habits, price sensitivity and patience. Real segments are not uniform.
- Each panelist reacts to the product AS FRAMED — the angle and the problem statement — not to a better product you can imagine.
- Count honestly: wouldAdopt means they would install and use it within a month, unsure means they see it but wouldn't move, wouldNot means they actively decline. The three counts must sum to exactly 12.
- Objections must be things a real person in this segment would say, in their words, about their situation. "It might not scale" is not a user objection; "my clients pay by bank transfer so this covers none of my invoices" is.
- The strongest objection is the one that, if unaddressed, costs the most adoptions — not the most dramatic one.
- adjustments: the 2-3 concrete changes to the framing or product that would flip the largest number of "unsure" panelists. Changes, not reassurances.

Calibration:
- A panel that mostly adopts is rare. If research showed weak demand signals, the panel should reflect that lukewarmness.
- Use the market analysis risks: if a risk is real, at least one panelist should hit it.
- Do not average everything into mush. Distinct voices, distinct objections.`;

export const SIMULATE_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    panelSize: {
      type: "integer",
      enum: [12],
      description: "Always 12.",
    },
    wouldAdopt: {
      type: "integer",
      minimum: 0,
      maximum: 12,
      description: "Would install and use within a month.",
    },
    unsure: {
      type: "integer",
      minimum: 0,
      maximum: 12,
      description: "See it, but would not move yet.",
    },
    wouldNot: {
      type: "integer",
      minimum: 0,
      maximum: 12,
      description: "Actively decline. The three counts must sum to 12.",
    },
    personaNotes: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
      description:
        "Short sketches of representative panelists and how they reacted, one line each.",
    },
    objections: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          objection: {
            type: "string",
            description: "In the panelist's own words, about their situation.",
          },
          severity: {
            type: "string",
            enum: ["minor", "moderate", "dealbreaker"],
          },
        },
        required: ["objection", "severity"],
      },
    },
    strongestObjection: {
      type: "string",
      description:
        "The objection that costs the most adoptions if unaddressed.",
    },
    adjustments: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string" },
      description:
        "Concrete changes that would flip the most 'unsure' panelists.",
    },
  },
  required: [
    "panelSize",
    "wouldAdopt",
    "unsure",
    "wouldNot",
    "personaNotes",
    "objections",
    "strongestObjection",
    "adjustments",
  ],
};

export function simulateUserPrompt(
  framing: Framing,
  research: ResearchResult,
  analysis: AnalysisResult,
): string {
  const signals = research.demandSignals.length
    ? research.demandSignals
        .map((s) => `- [${s.strength}] ${s.signal}`)
        .join("\n")
    : "- none found";

  return `PRODUCT AS FRAMED
Angle: ${framing.angle}
Target user: ${framing.targetUser}
Problem: ${framing.problem}

WHAT RESEARCH FOUND
Demand signals:
${signals}
Competitors in the panel's world: ${
    research.competitors.map((c) => c.name).join(", ") || "none found"
  }

MARKET ANALYSIS
Score ${analysis.score}/10 (${analysis.verdict}). ${analysis.reasoning}
Known risks:
${analysis.keyRisks.map((r) => `- ${r}`).join("\n")}

Convene the panel and report with the submit_simulation tool.`;
}
