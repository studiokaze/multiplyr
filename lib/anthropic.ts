import Anthropic from "@anthropic-ai/sdk";

/**
 * Single place to swap the model for every agent.
 * Pinned per the build spec. `claude-opus-5` is a drop-in swap if you want
 * the stronger model for the validator/builder stages.
 */
export const MODEL = "claude-sonnet-4-6";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    // The desktop build stores the key in the OS keychain, so telling a
    // desktop user to edit .env.local would send them nowhere useful.
    throw new Error(
      process.env.MULTIPYLER_DESKTOP === "1"
        ? "No Anthropic API key set. Open the File menu (multipyler menu on macOS) and choose “Anthropic API key…” to add one."
        : "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/** Concatenate every text block in a response. */
export function textOf(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/**
 * Structured output helper.
 *
 * `claude-sonnet-4-6` does not support `output_config.format`, so we force a
 * single tool call instead — that guarantees the model emits JSON matching the
 * schema rather than prose we'd have to scrape.
 */
export async function structured<T>(opts: {
  system: string;
  userContent: Anthropic.MessageParam["content"];
  toolName: string;
  toolDescription: string;
  schema: Anthropic.Tool["input_schema"];
  maxTokens?: number;
}): Promise<T> {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.schema,
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
    messages: [{ role: "user", content: opts.userContent }],
  });

  const call = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
  );
  if (!call) {
    throw new Error(`Model did not call ${opts.toolName}`);
  }
  return call.input as T;
}

/** Turn any thrown value into a JSON error response body. */
export function errorBody(err: unknown): { error: string } {
  if (err instanceof Anthropic.APIError) {
    return { error: `Anthropic API error ${err.status}: ${err.message}` };
  }
  return { error: err instanceof Error ? err.message : String(err) };
}
