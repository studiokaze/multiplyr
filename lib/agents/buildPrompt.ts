import type { AnalysisResult, Framing, SimulationResult } from "@/lib/types";

export const BUILD_SYSTEM = `You are the builder agent. You scaffold a minimal single-page React demo of a validated product idea, by calling the write_file tool once per file.

Output target — the preview renders your files in a browser sandbox with React 18, ReactDOM, and Babel already loaded from a CDN, and Tailwind's CDN build for styling. So:

- Write exactly these files, in this order:
  1. "App.jsx"       — the whole app: one default-exported \`App\` component plus any sub-components.
  2. "README.md"     — 5-10 lines: what this demo is, who it's for, what's faked.
- Do NOT write index.html, package.json, tsconfig, vite config, or any build tooling. The harness supplies those.
- In App.jsx use plain JSX with NO import and NO export statements — the sandbox evaluates it as a script with React in scope. Declare \`function App() { ... }\` at the top level. Use \`React.useState\`, \`React.useEffect\` etc. rather than bare \`useState\`.
- Style with Tailwind utility classes only. No CSS files, no styled-components, no UI libraries.
- No network calls, no localStorage, no external images. Seed 3-6 realistic hardcoded records so the UI looks alive on first paint.

Scope — this is a demo of the core idea, not a product:
- One screen. Make the single most important interaction actually work (filtering, adding, scoring, whatever the wedge is).
- Do not build auth, settings, routing, or empty-state scaffolding for features that don't exist.
- Keep App.jsx under ~200 lines. If you are writing a fifth sub-component, you have overscoped.

Call write_file for App.jsx first, then README.md, then stop. Do not narrate between calls.`;

export const WRITE_FILE_TOOL = {
  name: "write_file",
  description:
    "Write one file into the generated project. Call once per file. Overwrites if the path already exists.",
  input_schema: {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description:
          'Relative path, e.g. "App.jsx" or "README.md". No leading slash, no "..".',
      },
      content: {
        type: "string",
        description: "The complete file contents. Never a diff or a fragment.",
      },
    },
    required: ["path", "content"],
  },
};

export const LIST_FILES_TOOL = {
  name: "list_files",
  description:
    "List the paths written so far in this project. Takes no arguments.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

export const EDIT_SYSTEM = `You are the builder agent in EDIT mode. The project already exists; the user wants one specific change. The same sandbox rules apply as when building: App.jsx is plain JSX with no imports/exports, React via the React.* namespace, Tailwind utility classes only, no network calls.

Rules of an edit:
- Change ONLY what the instruction requires. Do not refactor, rename, restyle or "improve" anything the user did not ask about.
- Return the COMPLETE new contents of every file you change — never a diff, never a fragment. Files you do not change are not returned at all.
- If the instruction is ambiguous, pick the most conventional reading and note it in one short line at the top of README.md's changelog section (create "## Changes" if absent) — do not stall.
- Keep App.jsx under ~200 lines after the edit.`;

export function editUserPrompt(
  files: { path: string; content: string }[],
  instruction: string,
): string {
  const project = files
    .map((f) => `=== ${f.path} ===\n${f.content}`)
    .join("\n\n");
  return `CURRENT PROJECT FILES

${project}

USER'S EDIT REQUEST
"""
${instruction}
"""

Apply the edit. Return only the files that change, each complete.`;
}

export function buildUserPrompt(
  framing: Framing,
  analysis: AnalysisResult,
  simulation?: SimulationResult | null,
): string {
  const simulationBlock = simulation
    ? `
The synthetic user panel (${simulation.wouldAdopt}/${simulation.panelSize} would adopt) raised this as the strongest objection:
"${simulation.strongestObjection}"
Where it can be done in one screen, the demo should visibly answer that objection — through a default, a control, or copy in the UI — rather than ignore it.`
    : "";

  return `Build a single-screen React demo of this validated idea.

Angle: ${framing.angle}
Target user: ${framing.targetUser}
Problem: ${framing.problem}

Market analysis scored this ${analysis.score}/10 (${analysis.verdict}) and said: ${analysis.reasoning}
${simulationBlock}

The demo must make the core interaction of this wedge tangible in one screen. Start writing files now.`;
}
