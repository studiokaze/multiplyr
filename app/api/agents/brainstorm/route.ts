import { NextResponse } from "next/server";
import { errorBody, structured } from "@/lib/anthropic";
import {
  BRAINSTORM_SYSTEM,
  BRAINSTORM_TOOL_SCHEMA,
  brainstormUserPrompt,
} from "@/lib/agents/brainstormPrompt";
import type { BrainstormResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { idea, feedback } = (await req.json()) as {
      idea?: string;
      feedback?: string;
    };
    if (!idea?.trim()) {
      return NextResponse.json({ error: "idea is required" }, { status: 400 });
    }

    const result = await structured<BrainstormResult>({
      system: BRAINSTORM_SYSTEM,
      userContent: brainstormUserPrompt(idea.trim(), feedback?.trim()),
      toolName: "submit_framings",
      toolDescription: "Submit 2-3 sharpened framings of the founder's idea.",
      schema: BRAINSTORM_TOOL_SCHEMA,
      maxTokens: 4000,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(errorBody(err), { status: 500 });
  }
}
