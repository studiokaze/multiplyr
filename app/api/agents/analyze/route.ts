import { NextResponse } from "next/server";
import { errorBody, structured } from "@/lib/anthropic";
import {
  ANALYZE_SYSTEM,
  ANALYZE_TOOL_SCHEMA,
  analyzeUserPrompt,
} from "@/lib/agents/analyzePrompt";
import type { AnalysisResult, Framing, ResearchResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Keep verdict and score consistent even if the model drifts. */
function reconcile(a: AnalysisResult): AnalysisResult {
  const score = Math.min(10, Math.max(1, Math.round(a.score)));
  const verdict = score <= 4 ? "kill" : score <= 7 ? "iterate" : "build";
  return { ...a, score, verdict };
}

export async function POST(req: Request) {
  try {
    const { framing, research } = (await req.json()) as {
      framing?: Framing;
      research?: ResearchResult;
    };
    if (!framing?.angle || !research) {
      return NextResponse.json(
        { error: "framing and research are required" },
        { status: 400 },
      );
    }

    const result = await structured<AnalysisResult>({
      system: ANALYZE_SYSTEM,
      userContent: analyzeUserPrompt(framing, research),
      toolName: "submit_analysis",
      toolDescription:
        "Submit the build/iterate/kill verdict, score, reasoning and key risks.",
      schema: ANALYZE_TOOL_SCHEMA,
      maxTokens: 4000,
    });

    return NextResponse.json(reconcile(result));
  } catch (err) {
    return NextResponse.json(errorBody(err), { status: 500 });
  }
}
