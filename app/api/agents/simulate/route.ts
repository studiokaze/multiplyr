import { NextResponse } from "next/server";
import { errorBody, structured } from "@/lib/anthropic";
import {
  SIMULATE_SYSTEM,
  SIMULATE_TOOL_SCHEMA,
  simulateUserPrompt,
} from "@/lib/agents/simulatePrompt";
import type {
  AnalysisResult,
  Framing,
  ResearchResult,
  SimulationResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * The three counts must sum to the panel size; if the model drifts, absorb
 * the difference into "unsure" rather than failing the run.
 */
function reconcile(s: SimulationResult): SimulationResult {
  const panelSize = 12;
  const adopt = Math.min(panelSize, Math.max(0, Math.round(s.wouldAdopt)));
  const not = Math.min(
    panelSize - adopt,
    Math.max(0, Math.round(s.wouldNot)),
  );
  return {
    ...s,
    panelSize,
    wouldAdopt: adopt,
    wouldNot: not,
    unsure: panelSize - adopt - not,
  };
}

export async function POST(req: Request) {
  try {
    const { framing, research, analysis } = (await req.json()) as {
      framing?: Framing;
      research?: ResearchResult;
      analysis?: AnalysisResult;
    };
    if (!framing?.angle || !research || !analysis) {
      return NextResponse.json(
        { error: "framing, research and analysis are required" },
        { status: 400 },
      );
    }

    const result = await structured<SimulationResult>({
      system: SIMULATE_SYSTEM,
      userContent: simulateUserPrompt(framing, research, analysis),
      toolName: "submit_simulation",
      toolDescription:
        "Submit the synthetic panel's counts, personas, objections and adjustments.",
      schema: SIMULATE_TOOL_SCHEMA,
      maxTokens: 6000,
    });

    return NextResponse.json(reconcile(result));
  } catch (err) {
    return NextResponse.json(errorBody(err), { status: 500 });
  }
}
