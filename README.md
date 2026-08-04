# multipyler

An AI app builder with a validation pipeline in front of the code generation.

Most AI builders go idea → code. This one goes **idea → brainstorm → research → market validation → build**, and only reaches the builder agent on a `build` verdict. The validation layer is the product; the code generation is table stakes.

## Two products, one codebase

The web build and the desktop build are different products and look it:

| | Web | Desktop |
| --- | --- | --- |
| Job | Sell the thing and hand over a download | Run the pipeline |
| Root route | Dark marketing site | The app's "what are we validating?" entry |
| Visual system | Near-black, centred, one bright CTA | Warm paper, hairline rules, instrument density |

[`app/page.tsx`](app/page.tsx) is a **server component** that forks on
`MULTIPYLER_DESKTOP`, which [`electron/main.js`](electron/main.js) sets when it
starts the bundled server. The branch happens on the server, so the marketing
bundle never ships inside the app — and someone who already installed it is
never shown a download button.

## Pipeline

| Stage | Agent | What it does |
| --- | --- | --- |
| 1 | **Brainstorm** | Expands a one-line idea into 2-3 sharper framings (`angle` / `targetUser` / `problem`). The top framing auto-runs after 6s unless you pick a different one. |
| 2 | **Research** | Runs 3-5 web searches via the `web_search` server tool, then extracts structured competitors / demand signals / gaps. |
| 3 | **Market analysis** | Returns `{verdict, score, reasoning, keyRisks}`. Prompted to be honest — absence of demand signals counts against the idea, and a crowded market is a kill. The verdict is recomputed from the score server-side, so the model can't talk past the gate. |
| 4 | **Simulate** | Only on `build`. Convenes a synthetic panel of 12 users from the target segment: adopt/unsure/decline counts, objections with severity, and the adjustments that would flip the unsure. |
| 5 | **Build** | Uses a `write_file` tool to scaffold a single-page React demo, streamed into the UI file by file. The prompt carries the simulation's strongest objection so the demo visibly answers it. |

A non-`build` verdict at stage 3 blocks both simulate and build — with "try another
framing" and a deliberately subordinate "build it anyway" override.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000, type an idea, watch it run.

## Architecture

```
app/
  page.tsx                      server fork: marketing site (web) vs app entry (desktop)
  builder/page.tsx              3-pane workspace, orchestrates the pipeline
components/marketing/           the website: nav, hero, product shot, verdict, downloads
components/AppHome.tsx          the app's entry screen
  api/agents/brainstorm/route.ts
  api/agents/research/route.ts  two-pass: web_search, then forced-tool extraction
  api/agents/validate/route.ts
  api/agents/build/route.ts     SSE stream, write_file tool-use loop
components/
  BuilderChat.tsx               left pane: stage progress, framings, verdict
  FileTree.tsx                  middle pane: generated files
  PreviewPane.tsx               right pane: sandboxed iframe preview
lib/
  anthropic.ts                  shared client + MODEL constant + structured() helper
  types.ts
  agents/*Prompt.ts             one system prompt + JSON schema per agent
```

## Behaviour under failure

The pipeline is a state machine in [`hooks/usePipeline.ts`](hooks/usePipeline.ts), not a straight-line script:

- **Any stage can be retried** — retrying re-runs that stage and everything downstream of it.
- **Cancel** aborts the in-flight request. The build route listens for the client disconnect and stops the model mid-turn rather than burning tokens into a closed socket.
- **A non-`build` verdict is not a dead end.** The build stage enters a `blocked` state offering "try another framing" (re-runs research + validate on a different angle) or a new idea. There is a deliberately subordinate "build it anyway" override.
- **Refresh-safe.** State is persisted to `sessionStorage` per idea and restored on load; anything interrupted mid-flight comes back marked as failed and retryable.
- **The gate cannot be talked around.** `validate` recomputes the verdict from the score server-side, so a model returning `verdict: "build"` with `score: 3` is corrected to `kill`.

### Notes on the implementation

- **Model** is pinned in one place: `MODEL` in `lib/anthropic.ts`. Swap it to `claude-opus-5` there if you want the stronger model on the validator and builder stages.
- **Structured output** uses forced tool calls (`tool_choice: {type: "tool"}`) rather than `output_config.format`, because `claude-sonnet-4-6` does not support the latter. The tool schema is the contract.
- **Research runs in two passes** — one with `web_search` enabled to gather evidence, one with a forced tool call to convert it to JSON. That avoids scraping prose and keeps the search pass free to use as many searches as it needs. `pause_turn` is handled with a resume loop.
- **The builder streams**: file contents arrive as `input_json_delta` chunks, so the middle pane fills in as the agent writes rather than all at once when the turn ends.
- **No database.** Pipeline state lives in React state for the session. No auth, no payments, no sandboxed execution — the preview is a CDN-React iframe, not a container.
- **Path safety**: `write_file` paths are rejected if absolute, drive-prefixed, or containing `..`.

## Desktop app

Ships as a direct download — no Microsoft Store, no Mac App Store.

```bash
npm run desktop      # build the standalone bundle and run it in Electron
npm run dist:win     # → dist/multipyler-setup.exe
npm run dist:mac     # → dist/multipyler-mac-arm64.dmg, dist/multipyler-mac-x64.dmg
```

Windows and Linux installers can be produced on any machine; the macOS `.dmg`
must be built on macOS, which is what the `macos-latest` CI runner is for.

### Two build guards

Packaging is checked at both ends, because the failure mode here is an
installer that builds happily and then dies on the user's machine:

- **`beforePack`** re-copies `.next/static` and `public/` into the standalone
  bundle (Next omits them deliberately) and refuses to package without them —
  otherwise the app ships with no CSS or JS.
- **`afterPack`** boot-smoke-tests the packaged output: server entry, its
  bundled `node_modules/next` and `react`, the static assets and the agent
  routes must all physically exist under `resources/`. This exists because
  electron-builder silently filters `node_modules` out of `extraResources`,
  which shipped an app that died instantly on `Cannot find module 'next'`.

If the app ever fails to start, the shell writes the server's own output to
`server.log` in the user-data directory (`%APPDATA%/multipyler` on Windows,
`~/Library/Application Support/multipyler` on macOS) and names that path in the
error dialog.

### How it works

The app has server-side API routes, so it can't be a static export. `next build`
runs with `output: "standalone"`, and [`electron/main.js`](electron/main.js)
forks that server on a random loopback port (using Electron's bundled Node via
`ELECTRON_RUN_AS_NODE`, so end users need no Node install) and points a
`BrowserWindow` at it. [`scripts/prepare-desktop.mjs`](scripts/prepare-desktop.mjs)
copies `.next/static` and `public/` into the bundle, which Next deliberately
omits so you can host them on a CDN.

### Routes, and why `/app` exists

| Route | Who sees it |
| --- | --- |
| `/` | The public marketing site. Statically prerendered. |
| `/welcome` | Desktop onboarding. Opened on first run and from the menu. |
| `/app` | The workspace entry — what the desktop shell actually opens. |
| `/builder` | The three-pane run. |

`/app` is a **separate route rather than a branch inside `/`** because `/` is
statically prerendered: an `if (process.env.MULTIPYLER_DESKTOP)` check there is
evaluated at *build* time, not per request, so the desktop app was served
whatever the build machine produced (in practice: the marketing page, inside
the app). Two routes, two prerenders, no ambiguity.

### First-run onboarding

On first launch the shell opens `/welcome`, which explains the five stages and
asks for an Anthropic API key. The key is **validated against the live API
before it is saved** (`GET /v1/models`, in the main process) — a typo is caught
immediately rather than surfacing as a failed run later. On success the server
restarts with the key and the window lands on `/app`.

Re-open it any time from **File → Anthropic API key…** (the **multipyler** menu
on macOS — the onboarding copy adapts per platform). The same screen doubles as
the change-key screen, so there is one surface, not two.

### The API key is the user's, not yours

**No key is ever baked into the binary** — anything shipped can be extracted
from the package. On first launch the app asks for the user's own Anthropic key
and stores it in `userData`, encrypted with the OS keychain via Electron's
`safeStorage`. Change it later from the File menu ("multipyler" menu on macOS);
saving restarts the local server, since the key is read at boot.

The renderer never gets the secret back — `key:get` returns a masked hint like
`sk-ant-…f3a9`, and the preload bridge exposes exactly three IPC calls and
nothing else. `contextIsolation` is on and `nodeIntegration` is off.

### Releasing

`.github/workflows/release.yml` builds on `windows-latest` and `macos-latest`,
so no physical Mac is needed:

```bash
git tag v0.1.0 && git push origin v0.1.0
```

Installers are attached to a GitHub Release under fixed artifact names, which is
what lets the landing page link to `/releases/latest/download/<name>` without
knowing the version. Set `NEXT_PUBLIC_GITHUB_REPO=owner/repo` so those links
point at your repo.

Builds are **unsigned**: Windows SmartScreen and macOS Gatekeeper will warn on
first launch. Signing needs a paid certificate (an Authenticode cert for
Windows, an Apple Developer ID plus notarisation for macOS) — wire the
credentials in as repository secrets when you have them.

## Deploying to Vercel

```bash
npm i -g vercel
vercel                                    # first run links the project
vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

Or push to GitHub and import at vercel.com/new, then add `ANTHROPIC_API_KEY` under Settings → Environment Variables.

The build route sets `maxDuration = 300`. Vercel's Hobby plan caps function duration at 60s — either upgrade to Pro or lower `maxDuration` in `app/api/agents/build/route.ts` if builds time out there.

## Not built (deliberately)

Auth, payments/credits, real sandboxed execution of generated apps, cross-device
persistence, and more than one output app type. Session state persists in
`sessionStorage` only.

## Next up

- Code signing so the installers stop tripping SmartScreen and Gatekeeper
- Auto-update via `electron-updater` against the same GitHub Releases feed
- Credit gate on the validator and builder stages, which needs auth + payments
- Supabase persistence so sessions outlive the browser tab
- Real sandboxed execution for generated apps, replacing the CDN-React iframe
