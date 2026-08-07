import { NextResponse } from "next/server";
import { errorBody, structured } from "@/lib/anthropic";
import {
  MARKET_SYSTEM,
  MARKET_TOOL_SCHEMA,
  marketUserPrompt,
} from "@/lib/agents/marketPrompt";
import type {
  AnalysisResult,
  Framing,
  MarketingResult,
  ResearchResult,
  SimulationResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  try {
    const { framing, analysis, simulation, research, revise } =
      (await req.json()) as {
        framing?: Framing;
        analysis?: AnalysisResult;
        // Both optional: a "build anyway" run has no simulation, and very old
        // sessions may retry marketing without research in the snapshot.
        simulation?: SimulationResult | null;
        research?: ResearchResult | null;
        /** Chat-back: revise existing copy per the user's instruction. */
        revise?: { instruction?: string; marketing?: MarketingResult };
      };

    if (revise?.instruction?.trim() && revise.marketing) {
      const result = await structured<MarketingResult>({
        system: `${MARKET_SYSTEM}

REVISION MODE: the launch copy already exists. Apply the user's requested change and return the COMPLETE updated object. Change only what the request requires — do not rewrite posts the user did not mention.`,
        userContent: `CURRENT COPY
${JSON.stringify(revise.marketing, null, 1)}

USER'S CHANGE REQUEST
"""
${revise.instruction.trim()}
"""${framing?.angle ? `

PRODUCT
Angle: ${framing.angle}
Target user: ${framing.targetUser}` : ""}`,
        toolName: "submit_marketing",
        toolDescription: "Submit the complete revised launch copy.",
        schema: MARKET_TOOL_SCHEMA,
        maxTokens: 4000,
      });
      return NextResponse.json(result);
    }

    if (!framing?.angle || !analysis) {
      return NextResponse.json(
        { error: "framing and analysis are required" },
        { status: 400 },
      );
    }

    const result = await structured<MarketingResult>({
      system: MARKET_SYSTEM,
      userContent: marketUserPrompt(
        framing,
        analysis,
        simulation ?? null,
        research ?? null,
      ),
      toolName: "submit_marketing",
      toolDescription:
        "Submit the positioning line, the three platform posts, the ranked channels and the objection the copy answers.",
      schema: MARKET_TOOL_SCHEMA,
      maxTokens: 4000,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorBody(err), { status: 500 });
  }
}
