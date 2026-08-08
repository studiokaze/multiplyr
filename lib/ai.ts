/**
 * Agent-facing AI surface. Assignment per the routing spec: Gemini leads the
 * thinking stages (brainstorm, analysis — its free tier is the generous
 * one), OpenRouter's free coding model leads the builder, and research runs
 * Gemini's Google Search grounding with an OpenRouter fallback chain.
 * Everything rides lib/providers for cache, throttle and backoff.
 */

import {
  cacheKey,
  cached,
  callGemini,
  callGroq,
  callOpenRouter,
  keyFor,
  storeCache,
  type ProviderName,
} from "@/lib/providers";

export function hasProviders(): boolean {
  return Boolean(
    keyFor("gemini") || keyFor("openrouter") || keyFor("groq"),
  );
}

type JsonArgs = {
  system: string;
  user: string;
  schema: unknown;
  maxTokens?: number;
  /** Which provider should lead the lane for this call. */
  prefer?: ProviderName;
};

/**
 * Models writing multi-KB code inside JSON strings routinely emit literal
 * newlines and tabs where 
 belongs — fatal to JSON.parse ("bad control
 * character"). This walks the text and escapes control characters that sit
 * inside string literals, leaving structure untouched.
 */
function repairJson(s: string): string {
  let out = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === "\\") {
        // JSON allows only these escapes; models also emit \' and \x from
        // code habits. Invalid ones get their backslash doubled instead.
        const n = s[i + 1] ?? "";
        const validEsc = '"\\/bfnrtu'.includes(n);
        const validU =
          n !== "u" || /^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6));
        if (validEsc && validU) {
          out += c + n;
          i++;
        } else {
          out += "\\\\";
        }
        continue;
      }
      if (c === '"') {
        inStr = false;
        out += c;
        continue;
      }
      const code = c.charCodeAt(0);
      if (code < 0x20) {
        out +=
          code === 10
            ? "\\n"
            : code === 13
              ? "\\r"
              : code === 9
                ? "\\t"
                : "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
      out += c;
    } else {
      if (c === '"') inStr = true;
      out += c;
    }
  }
  return out;
}

/** Strip ```json fences and parse the first JSON object in the text. */
function parseJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model output");
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return JSON.parse(repairJson(slice));
  }
}

function laneOrder(prefer?: ProviderName): ProviderName[] {
  const all: ProviderName[] = ["gemini", "openrouter", "groq"];
  const order = prefer
    ? [prefer, ...all.filter((p) => p !== prefer)]
    : all;
  return order.filter((p) => Boolean(keyFor(p)));
}

/** Structured JSON with cache + lane fallback. Throws only if all fail. */
export async function jsonChat<T>(args: JsonArgs): Promise<T> {
  const lanes = laneOrder(args.prefer);
  if (!lanes.length) {
    throw new Error(
      "No model providers configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY or GROQ_API_KEY.",
    );
  }

  const key = cacheKey([args.system, args.user, JSON.stringify(args.schema)]);
  const hit = cached<T>(key);
  if (hit !== undefined) return hit;

  const system = `${args.system}\n\nRespond with ONLY a JSON object matching this schema exactly:\n${JSON.stringify(args.schema)}`;

  let firstErr: unknown;
  for (const lane of lanes) {
    // One automatic retry per lane: malformed JSON is usually a one-off,
    // and a parse error must never reach the user.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const call =
          lane === "gemini"
            ? callGemini({ system, user: args.user, json: true, maxTokens: args.maxTokens })
            : lane === "openrouter"
              ? callOpenRouter({ system, user: args.user, json: true, maxTokens: args.maxTokens })
              : callGroq({ system, user: args.user, json: true, maxTokens: args.maxTokens });
        const value = parseJson(await call) as T;
        storeCache(key, value);
        return value;
      } catch (err) {
        firstErr ??= err;
      }
    }
  }
  throw firstErr instanceof Error ? firstErr : new Error(String(firstErr));
}

/**
 * Plain-text completion across the same lanes — for outputs (like code
 * files) that must NOT ride inside JSON strings, where models corrupt
 * escapes constantly. Cached like jsonChat.
 */
export async function rawChat(args: {
  system: string;
  user: string;
  maxTokens?: number;
  prefer?: ProviderName;
}): Promise<string> {
  const lanes = laneOrder(args.prefer);
  if (!lanes.length) throw new Error("No model providers configured.");
  const key = cacheKey(["raw", args.system, args.user]);
  const hit = cached<string>(key);
  if (hit !== undefined) return hit;

  let firstErr: unknown;
  for (const lane of lanes) {
    try {
      const text =
        lane === "gemini"
          ? await callGemini({ system: args.system, user: args.user, maxTokens: args.maxTokens })
          : lane === "openrouter"
            ? await callOpenRouter({ system: args.system, user: args.user, maxTokens: args.maxTokens })
            : await callGroq({ system: args.system, user: args.user, maxTokens: args.maxTokens });
      storeCache(key, text);
      return text;
    } catch (err) {
      firstErr ??= err;
    }
  }
  throw firstErr instanceof Error ? firstErr : new Error(String(firstErr));
}

/**
 * Live-web research: Gemini grounding first (verified free on this key),
 * OpenRouter `:online` second, and an honest ungrounded answer as the last
 * lane — sparse research is a result, not a failure (Flow 4).
 */
export async function searchGrounded(opts: {
  system: string;
  user: string;
}): Promise<string> {
  const key = cacheKey(["search", opts.system, opts.user]);
  const hit = cached<string>(key);
  if (hit !== undefined) return hit;

  if (keyFor("gemini")) {
    try {
      const text = await callGemini({
        system: opts.system,
        user: opts.user,
        search: true,
      });
      storeCache(key, text);
      return text;
    } catch {
      // fall through
    }
  }
  if (keyFor("openrouter")) {
    try {
      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keyFor("openrouter")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b:free",
            plugins: [{ id: "web" }],
            messages: [
              { role: "system", content: opts.system },
              { role: "user", content: opts.user },
            ],
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          storeCache(key, text);
          return text;
        }
      }
    } catch {
      // fall through
    }
  }
  const out = await jsonChat<{ findings: string }>({
    system: opts.system,
    user: `${opts.user}\n\nYou have no live web access — answer from prior knowledge and say so plainly.`,
    schema: {
      type: "object",
      properties: { findings: { type: "string" } },
      required: ["findings"],
    },
  });
  storeCache(key, out.findings);
  return out.findings;
}
