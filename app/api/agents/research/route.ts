import type Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { hasProviders, searchGrounded } from "@/lib/ai";
import { MODEL, anthropic, errorBody, structured, textOf } from "@/lib/anthropic";
import {
  RESEARCH_EXTRACT_SYSTEM,
  RESEARCH_SEARCH_SYSTEM,
  RESEARCH_TOOL_SCHEMA,
  researchUserPrompt,
} from "@/lib/agents/researchPrompt";
import type { Framing, ResearchResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_RESUMES = 4;

export async function POST(req: Request) {
  try {
    const { framing } = (await req.json()) as { framing?: Framing };
    if (!framing?.angle) {
      return NextResponse.json(
        { error: "framing is required" },
        { status: 400 },
      );
    }

    // Production lane: grounded search on our own providers, then the
    // provider-agnostic structured() pass turns prose into the contract.
    if (hasProviders()) {
      const summary = await searchGrounded({
        system: RESEARCH_SEARCH_SYSTEM,
        user: researchUserPrompt(framing),
      });
      const result = await structured<ResearchResult>({
        system: RESEARCH_EXTRACT_SYSTEM,
        userContent: `RESEARCH NOTES\n${summary}`,
        toolName: "submit_research",
        toolDescription:
          "Submit the competitors, demand signals and gaps found during research.",
        schema: RESEARCH_TOOL_SCHEMA,
        maxTokens: 8000,
      });
      return NextResponse.json({ ...result, summary });
    }

    const client = anthropic();
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: researchUserPrompt(framing) },
    ];

    // Pass 1 — let the model search. A long server-tool turn can stop with
    // `pause_turn`; re-send the assistant turn to resume where it left off.
    let res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: RESEARCH_SEARCH_SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages,
    });

    for (let i = 0; res.stop_reason === "pause_turn" && i < MAX_RESUMES; i++) {
      messages.push({ role: "assistant", content: res.content });
      res = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: RESEARCH_SEARCH_SYSTEM,
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        ],
        messages,
      });
    }

    // Pass 2 — same conversation, forced tool call so the output is real JSON
    // rather than prose we would have to scrape.
    messages.push({ role: "assistant", content: res.content });
    messages.push({ role: "user", content: RESEARCH_EXTRACT_SYSTEM });

    const extract = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      tools: [
        {
          name: "submit_research",
          description:
            "Submit the competitors, demand signals and gaps found during research.",
          input_schema: RESEARCH_TOOL_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "submit_research" },
      messages,
    });

    const call = extract.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (!call) {
      return NextResponse.json(
        { error: "Research agent did not return structured output" },
        { status: 502 },
      );
    }

    const result = call.input as ResearchResult;
    return NextResponse.json({ ...result, summary: textOf(res.content) });
  } catch (err) {
    return NextResponse.json(errorBody(err), { status: 500 });
  }
}
