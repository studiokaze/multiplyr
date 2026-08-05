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
    const { framing, analysis, simulation, research } =
      (await req.json()) as {
        framing?: Framing;
        analysis?: AnalysisResult;
        // Both optional: a "build anyway" run has no simulation, and very old
        // sessions may retry marketing without research in the snapshot.
        simulation?: SimulationResult | null;
        research?: ResearchResult | null;
      };
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
