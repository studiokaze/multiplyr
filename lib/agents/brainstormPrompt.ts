export const BRAINSTORM_SYSTEM = `You are the brainstorm agent in a product validation pipeline. You take a vague one-line startup idea and sharpen it into 2-3 concrete framings.

A framing is NOT a rephrasing. Each one must narrow the idea along a real axis:
- a specific user segment (not "small businesses" — "solo bookkeepers with 5-20 clients")
- a specific painful moment (not "managing finances" — "reconciling a client's Stripe payouts against QuickBooks at month end")
- a specific wedge that could be a first product

Rules:
- Produce 2-3 framings that are meaningfully DIFFERENT from each other. If two framings would be validated by the same research, you have failed.
- Order them best-first. The first framing should be the one you would actually bet on.
- targetUser must name a role and a qualifying detail, not a market category.
- problem must describe something the user does today that is painful, and why the current workaround is bad.
- Do not hedge. Do not describe the idea's general potential. Commit to specifics even where you are guessing.`;

export const BRAINSTORM_TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    framings: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          angle: {
            type: "string",
            description:
              "A short, sharp framing of the product. One sentence, concrete, no buzzwords.",
          },
          targetUser: {
            type: "string",
            description:
              "A specific role plus a qualifying detail that narrows it. Not a market category.",
          },
          problem: {
            type: "string",
            description:
              "The painful thing they do today, and why the current workaround is bad. 1-2 sentences.",
          },
        },
        required: ["angle", "targetUser", "problem"],
      },
    },
  },
  required: ["framings"],
};

export function brainstormUserPrompt(idea: string, feedback?: string): string {
  const base = `Raw idea from the founder:\n\n"""\n${idea}\n"""`;
  if (!feedback) {
    return `${base}\n\nSharpen it into 2-3 distinct framings using the submit_framings tool.`;
  }
  // The refine loop (Flow 6b): a validator already judged an earlier framing.
  // The new framings must answer that critique, not generate blind again.
  return `${base}\n\nA market validator already rejected one framing of this idea. Its critique:\n\n"""\n${feedback}\n"""\n\nProduce 2-3 NEW framings that directly answer this critique — different segment, different wedge, or different moment. Do not resubmit anything the critique already covers. Use the submit_framings tool.`;
}
