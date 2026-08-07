import type { Framing } from "@/lib/types";

/**
 * The research agent runs in two passes:
 *  1. search pass  — web_search enabled, model gathers evidence
 *  2. extract pass — same conversation, forced tool call to emit structured JSON
 * Splitting them means we never have to scrape prose, and the search pass stays
 * free to use as many searches as it needs.
 */

export const RESEARCH_SEARCH_SYSTEM = `You are the research agent in a product validation pipeline. Given a product framing, find what already exists and whether anyone actually wants this.

Run 3-5 web searches. No more — this needs to finish in seconds, not minutes. Prioritise:
1. Direct competitors and near-substitutes (including the manual/spreadsheet workaround people use today).
2. Demand signals: people complaining about this problem, asking for a tool, or paying for a bad one. Reddit/HN/forum threads, job posts, "alternatives to X" pages.
3. Gaps: what the existing players do badly, or which segment they ignore.

Be adversarial. You are looking for reasons this is already solved, not reasons to be excited. If the space is crowded, say so plainly. If you find no demand signal at all, that is itself the finding — do not invent one.

Also note, where the searches reveal it: WHERE the demand concentrates (countries/regions), WHICH audience segments feel it hardest, and how interest has trended over the last 12 months (rising, seasonal, flat). These feed the demand charts, so gather what the evidence supports.

After searching, summarise what you found in plain text. Cite the URL for anything you claim.`;

export const RESEARCH_EXTRACT_SYSTEM = `Convert the research notes into structured data using the submit_research tool.

- Prefer things the notes actually cite from live search results.
- If the notes are from prior knowledge (no live web), still name the REAL, well-known competitors and demand patterns for this market — real companies only, url as empty string. A market summary that discusses competitors but returns an empty competitors array is a wrong answer.
- Never invent a company that does not exist. If the market is genuinely empty, say so via an empty array — that is rare and meaningful.`;

export const RESEARCH_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          url: {
            type: "string",
            description: "URL found in search results, or empty string if none.",
          },
          whatTheyDo: { type: "string" },
          weakness: {
            type: "string",
            description:
              "Where they fall short for this specific target user. Be concrete.",
          },
        },
        required: ["name", "url", "whatTheyDo", "weakness"],
      },
    },
    demandSignals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          signal: {
            type: "string",
            description: "What was observed, e.g. a recurring complaint.",
          },
          source: { type: "string", description: "URL or publication name." },
          strength: { type: "string", enum: ["weak", "moderate", "strong"] },
        },
        required: ["signal", "source", "strength"],
      },
    },
    gaps: {
      type: "array",
      items: { type: "string" },
      description:
        "Openings the existing players leave. Empty array if the space looks saturated.",
    },
    searchesRun: {
      type: "array",
      items: { type: "string" },
      description: "The search queries you actually ran.",
    },
    monthlyInterest: {
      type: "array",
      minItems: 12,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          month: {
            type: "string",
            description: "Three-letter month, most recent 12, oldest first.",
          },
          interest: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description: "Relative search/discussion interest, 0-100.",
          },
        },
        required: ["month", "interest"],
      },
      description:
        "ESTIMATED 12-month interest curve for this problem, shaped by what the searches showed (trend direction, seasonality). Estimates are fine; label is 'estimated'.",
    },
    demandByRegion: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          region: { type: "string", description: "Country or region name." },
          share: {
            type: "integer",
            minimum: 5,
            maximum: 100,
            description: "Relative share of observed demand, roughly summing to 100.",
          },
        },
        required: ["region", "share"],
      },
      description:
        "Where the demand concentrates geographically, from the evidence (forum origins, market mentions). Estimated shares.",
    },
    audienceSegments: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short segment label." },
          pull: {
            type: "integer",
            minimum: 5,
            maximum: 100,
            description: "How hard this segment pulls, roughly summing to 100.",
          },
        },
        required: ["name", "pull"],
      },
      description: "The audience segments that feel this problem hardest.",
    },
  },
  required: [
    "competitors",
    "demandSignals",
    "gaps",
    "searchesRun",
    "monthlyInterest",
    "demandByRegion",
    "audienceSegments",
  ],
};

export function researchUserPrompt(framing: Framing): string {
  return `Research this product framing.

Angle: ${framing.angle}
Target user: ${framing.targetUser}
Problem: ${framing.problem}

Find competitors, demand signals, and gaps. 3-5 searches maximum.`;
}
