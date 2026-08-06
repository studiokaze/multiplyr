import type Anthropic from "@anthropic-ai/sdk";
import { hasProviders, jsonChat } from "@/lib/ai";
import { MODEL, anthropic } from "@/lib/anthropic";
import {
  BUILD_SYSTEM,
  EDIT_SYSTEM,
  LIST_FILES_TOOL,
  WRITE_FILE_TOOL,
  buildUserPrompt,
  editUserPrompt,
} from "@/lib/agents/buildPrompt";
import type {
  AnalysisResult,
  BuildEvent,
  Framing,
  GeneratedFile,
  SimulationResult,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TURNS = 8;

/** Reject anything that would escape the in-memory project root. */
function safePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!p || p.startsWith("/") || p.includes("..") || /^[a-zA-Z]:/.test(p)) {
    return null;
  }
  return p;
}

export async function POST(req: Request) {
  const { framing, analysis, simulation, edit } = (await req.json()) as {
    framing?: Framing;
    analysis?: AnalysisResult;
    simulation?: SimulationResult | null;
    /** Flow 9: edit mode — an instruction against the existing files. */
    edit?: { instruction?: string; files?: GeneratedFile[] };
  };

  const encoder = new TextEncoder();
  // Stop burning tokens the moment the browser goes away or hits Cancel.
  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: BuildEvent) => {
        if (closed || abort.signal.aborted) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // ---- Flow 9: edit mode -------------------------------------------
        if (edit?.instruction?.trim() && Array.isArray(edit.files)) {
          send({ type: "status", message: "Applying your edit…" });

          // Dev-mock fallback: no providers means no real edit — visibly
          // stamp the instruction into the files so the flow demos.
          if (!hasProviders()) {
            const app = edit.files.find((f) =>
              f.path.toLowerCase().endsWith("app.jsx"),
            );
            if (app) {
              send({
                type: "note",
                message: "simulated edit (no providers configured)",
              });
              send({
                type: "file",
                file: {
                  path: app.path,
                  content: `// edit applied (simulated): ${edit.instruction.trim()}\n${app.content}`,
                },
              });
              send({ type: "done", fileCount: 1 });
            } else {
              send({ type: "error", message: "No App.jsx to edit." });
            }
            controller.close();
            closed = true;
            return;
          }

          const out = await jsonChat<{ files: GeneratedFile[] }>({
            system: EDIT_SYSTEM,
            user: editUserPrompt(edit.files, edit.instruction.trim()),
            schema: {
              files: [
                { path: "App.jsx", content: "<the complete file>" },
                { path: "README.md", content: "<the complete file>" },
              ],
            } as unknown,
            maxTokens: 8000,
            prefer: "openrouter",
          });
          let changed = 0;
          for (const f of out.files ?? []) {
            const p = safePath(f.path);
            if (!p || typeof f.content !== "string") continue;
            send({ type: "file", file: { path: p, content: f.content } });
            changed++;
          }
          if (changed === 0) {
            send({
              type: "error",
              message: "That edit didn't come out right. Try rephrasing it.",
            });
          } else {
            send({ type: "done", fileCount: changed });
          }
          controller.close();
          closed = true;
          return;
        }

        if (!framing?.angle || !analysis) {
          send({ type: "error", message: "framing and analysis are required" });
          controller.close();
          return;
        }

        // Production lane: one structured files call on our own providers,
        // replayed to the client as the same SSE events the UI always spoke.
        if (hasProviders()) {
          send({ type: "status", message: "Builder agent starting…" });
          const out = await jsonChat<{ files: GeneratedFile[] }>({
            system: `${BUILD_SYSTEM}

IMPORTANT: there is no write_file tool here. Return EVERY file at once in the single JSON object's "files" array.`,
            user: buildUserPrompt(framing, analysis, simulation),
            schema: {
              files: [
                { path: "App.jsx", content: "<the complete file>" },
                { path: "README.md", content: "<the complete file>" },
              ],
            } as unknown,
            maxTokens: 8000,
            prefer: "openrouter",
          });
          // Salvage the tool-call habit: a bare {path, content} is one file.
          const rawOut = out as { files?: GeneratedFile[]; path?: string; content?: string };
          const outFiles =
            rawOut.files ??
            (rawOut.path && rawOut.content
              ? [{ path: rawOut.path, content: rawOut.content }]
              : []);
          let written = 0;
          for (const f of outFiles) {
            const p = safePath(f.path);
            if (!p || typeof f.content !== "string") {
              send({ type: "note", message: `refused path: ${String(f.path)}` });
              continue;
            }
            // Narrated, paced landing: the tree fills file by file in real
            // time instead of one silent burst at the end.
            send({ type: "status", message: `Writing ${p}…` });
            await new Promise((r) => setTimeout(r, 350));
            send({ type: "file", file: { path: p, content: f.content } });
            written++;
          }
          if (written === 0) {
            send({ type: "error", message: "Builder produced no usable files." });
          } else {
            send({ type: "done", fileCount: written });
          }
          controller.close();
          closed = true;
          return;
        }

        const client = anthropic();
        // In-memory project. Swap this Map for fs/tmpdir writes if you later
        // want the generated app on disk.
        const files = new Map<string, string>();
        const messages: Anthropic.MessageParam[] = [
          { role: "user", content: buildUserPrompt(framing, analysis, simulation) },
        ];

        send({ type: "status", message: "Builder agent starting…" });

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          if (abort.signal.aborted) break;

          const ms = client.messages.stream(
            {
              model: MODEL,
              max_tokens: 16000,
              system: BUILD_SYSTEM,
              tools: [WRITE_FILE_TOOL, LIST_FILES_TOOL],
              messages,
            },
            { signal: abort.signal },
          );

          // Accumulate streamed tool JSON so files land in the UI as the model
          // writes them, rather than all at once when the turn ends.
          const pending = new Map<number, { name: string; json: string }>();

          for await (const event of ms) {
            if (
              event.type === "content_block_start" &&
              event.content_block.type === "tool_use"
            ) {
              pending.set(event.index, {
                name: event.content_block.name,
                json: "",
              });
              if (event.content_block.name === "write_file") {
                send({ type: "status", message: "Writing a file…" });
              }
            } else if (
              event.type === "content_block_delta" &&
              event.delta.type === "input_json_delta"
            ) {
              const slot = pending.get(event.index);
              if (slot) slot.json += event.delta.partial_json;
            } else if (event.type === "content_block_stop") {
              const slot = pending.get(event.index);
              if (!slot || slot.name !== "write_file") continue;
              try {
                const input = JSON.parse(slot.json) as GeneratedFile;
                const path = safePath(input.path);
                if (path && typeof input.content === "string") {
                  files.set(path, input.content);
                  send({ type: "file", file: { path, content: input.content } });
                }
              } catch {
                // Malformed partial JSON — the tool_result below tells the
                // model, so let it retry rather than failing the whole build.
              }
            }
          }

          const message = await ms.finalMessage();
          messages.push({ role: "assistant", content: message.content });

          const calls = message.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (calls.length === 0 || message.stop_reason === "end_turn") {
            break;
          }

          const results: Anthropic.ToolResultBlockParam[] = calls.map((call) => {
            if (call.name === "list_files") {
              return {
                type: "tool_result",
                tool_use_id: call.id,
                content: JSON.stringify([...files.keys()]),
              };
            }
            const input = call.input as Partial<GeneratedFile>;
            const path = safePath(input.path);
            if (!path || typeof input.content !== "string") {
              return {
                type: "tool_result",
                tool_use_id: call.id,
                content:
                  "Rejected: path must be a relative path with no '..' and content must be a string.",
                is_error: true,
              };
            }
            files.set(path, input.content);
            return {
              type: "tool_result",
              tool_use_id: call.id,
              content: `Wrote ${path} (${input.content.length} bytes).`,
            };
          });

          messages.push({ role: "user", content: results });
        }

        if (abort.signal.aborted) {
          // Client walked away; nothing to report to.
        } else if (files.size === 0) {
          send({ type: "error", message: "Builder agent wrote no files." });
        } else {
          send({ type: "done", fileCount: files.size });
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed by a client disconnect.
        }
      }
    },

    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
