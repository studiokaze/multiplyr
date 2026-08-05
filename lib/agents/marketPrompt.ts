import type {
  AnalysisResult,
  Framing,
  ResearchResult,
  SimulationResult,
} from "@/lib/types";

export const MARKET_SYSTEM = `You are the marketing agent, the last stage of a product pipeline. Everything upstream of you is evidence: a chosen framing, live market research, a scored analysis, and a synthetic user panel with real objections. Your job is launch copy aimed at exactly the segment the pipeline validated — not "an audience".

Rules of the copy:
- Write to the target user in the framing, in language that segment actually uses. If the panel spoke in their words, borrow their words.
- The strongest objection from the simulation is the copy's job. Every post must implicitly answer it; name which objection you answered in answeredObjection.
- Lead with the problem, not the product. The product appears as the resolution, by name, once.
- No fabricated numbers, no invented testimonials, no "join thousands". The product just launched; the copy must be honest about that — early, small and specific is credible.
- Platform fit: X wants one sharp claim and no hashtags; LinkedIn wants a short first-person story with line breaks; Reddit wants a plain-text post that reads like a member, discloses that you built it, and invites criticism. Pick the specific subreddit where this segment already complains about this problem.
- channels: rank the 2-3 places this segment can actually be reached first, each entry "where — why".
- positioning: one sentence, the segment and the sharp difference, no adjectives doing the work nouns should do.`;

export const MARKET_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    positioning: {
      type: "string",
      description:
        "One sentence positioning the product for the exact segment.",
    },
    posts: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["x", "linkedin", "reddit"] },
          where: {
            type: "string",
            description:
              "Exactly where it goes: the subreddit, the community, or 'feed'.",
          },
          content: {
            type: "string",
            description: "The full post, ready to publish verbatim.",
          },
        },
        required: ["platform", "where", "content"],
      },
      description: "One post each for X, LinkedIn and Reddit.",
    },
    channels: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: { type: "string" },
      description: "Ranked 'where — why' entries for reaching the segment.",
    },
    answeredObjection: {
      type: "string",
      description:
        "The simulation objection the copy pre-answers, restated briefly.",
    },
  },
  required: ["positioning", "posts", "channels", "answeredObjection"],
};

export function marketUserPrompt(
  framing: Framing,
  analysis: AnalysisResult,
  simulation: SimulationResult | null,
  research: ResearchResult | null,
): string {
  const objections = simulation
    ? simulation.objections
        .map((o) => `- [${o.severity}] ${o.objection}`)
        .join("\n")
    : "- (the simulation was skipped for this run)";

  const competitors = research?.competitors.length
    ? research.competitors
        .map((c) => `- ${c.name}: ${c.whatTheyDo} (weakness: ${c.weakness})`)
        .join("\n")
    : "- none surfaced";

  return `THE PRODUCT AS VALIDATED
Angle: ${framing.angle}
Target user: ${framing.targetUser}
Problem: ${framing.problem}

ANALYSIS
Score ${analysis.score}/10 (${analysis.verdict}). ${analysis.reasoning}${
    analysis.bestNiche ? `\nBest niche: ${analysis.bestNiche}` : ""
  }

WHAT THE PANEL SAID
${
  simulation
    ? `${simulation.wouldAdopt} of ${simulation.panelSize} would adopt.\nStrongest objection: ${simulation.strongestObjection}`
    : "No panel was run."
}
Objections:
${objections}

THE INCUMBENTS THE COPY IS UP AGAINST
${competitors}

Write the launch copy with the submit_marketing tool.`;
}
