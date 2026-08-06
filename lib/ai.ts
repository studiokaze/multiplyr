/**
 * Multi-provider engine. The product runs on Multiplyer's own keys —
 * OpenRouter, Groq and Gemini — never the user's. Each call walks the lane
 * in order and uses the first configured provider; a provider failure falls
 * through to the next, so one outage never kills a run.
 *
 * Groq leads for speed, Gemini for grounded search, OpenRouter as the deep
 * fallback with the widest catalogue.
 */

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3-0324";

export function hasProviders(): boolean {
  return Boolean(
    process.env.GROQ_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENROUTER_API_KEY,
  );
}

type JsonArgs = {
  system: string;
  user: string;
  /** JSON schema, embedded in the prompt as the contract. */
  schema: unknown;
  maxTokens?: number;
};

/** Strip ```json fences and parse the first JSON object in the text. */
function parseJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model output");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function openAiCompatible(
  baseUrl: string,
  key: string,
  model: string,
  args: JsonArgs,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: args.maxTokens ?? 8000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${args.system}\n\nRespond with ONLY a JSON object matching this schema exactly:\n${JSON.stringify(args.schema)}`,
        },
        { role: "user", content: args.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${model}: HTTP ${res.status}`);
  const data = await res.json();
  return parseJson(data.choices?.[0]?.message?.content ?? "");
}

async function geminiJson(args: JsonArgs): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `${args.system}\n\nRespond with ONLY a JSON object matching this schema exactly:\n${JSON.stringify(args.schema)}`,
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: args.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: args.maxTokens ?? 8000,
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini: HTTP ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("");
  return parseJson(text ?? "");
}

/** Structured JSON across the provider lane. Throws only if all lanes fail. */
export async function jsonChat<T>(args: JsonArgs): Promise<T> {
  const lanes: Array<() => Promise<unknown>> = [];
  if (process.env.GROQ_API_KEY) {
    lanes.push(() =>
      openAiCompatible(
        "https://api.groq.com/openai/v1",
        process.env.GROQ_API_KEY!,
        GROQ_MODEL,
        args,
      ),
    );
  }
  if (process.env.GEMINI_API_KEY) lanes.push(() => geminiJson(args));
  if (process.env.OPENROUTER_API_KEY) {
    lanes.push(() =>
      openAiCompatible(
        "https://openrouter.ai/api/v1",
        process.env.OPENROUTER_API_KEY!,
        OPENROUTER_MODEL,
        args,
      ),
    );
  }
  if (!lanes.length) {
    throw new Error(
      "No model providers configured. Set GROQ_API_KEY, GEMINI_API_KEY or OPENROUTER_API_KEY.",
    );
  }
  let lastErr: unknown;
  for (const lane of lanes) {
    // One automatic retry per lane: malformed JSON is usually a one-off, and
    // the user must never see a parse error for it (Flow 2 edge case).
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return (await lane()) as T;
      } catch (err) {
        lastErr = err;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Live-web research pass. Gemini with Google Search grounding leads; an
 * OpenRouter `:online` model is the fallback; with neither key the caller
 * gets a plain (ungrounded) answer from whatever lane exists.
 */
export async function searchGrounded(opts: {
  system: string;
  user: string;
}): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts: [{ text: opts.user }] }],
          tools: [{ google_search: {} }],
        }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("");
      if (text) return text;
    }
  }
  if (process.env.OPENROUTER_API_KEY) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `${OPENROUTER_MODEL}:online`,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    }
  }
  // Last resort: ungrounded prose through the JSON lane's providers.
  const out = await jsonChat<{ findings: string }>({
    system: opts.system,
    user: `${opts.user}\n\nYou have no live web access — answer from prior knowledge and say so.`,
    schema: {
      type: "object",
      properties: { findings: { type: "string" } },
      required: ["findings"],
    },
  });
  return out.findings;
}
