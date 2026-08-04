export type Framing = {
  angle: string;
  targetUser: string;
  problem: string;
};

export type BrainstormResult = {
  framings: Framing[];
};

export type Competitor = {
  name: string;
  url: string;
  whatTheyDo: string;
  weakness: string;
};

export type DemandSignal = {
  signal: string;
  source: string;
  strength: "weak" | "moderate" | "strong";
};

export type ResearchResult = {
  competitors: Competitor[];
  demandSignals: DemandSignal[];
  gaps: string[];
  searchesRun: string[];
};

export type Verdict = "build" | "iterate" | "kill";

/** Output of the market-analysis agent (stage 03). */
export type AnalysisResult = {
  verdict: Verdict;
  score: number;
  reasoning: string;
  keyRisks: string[];
};

export type Objection = {
  objection: string;
  severity: "minor" | "moderate" | "dealbreaker";
};

/** Output of the simulate agent (stage 04): a synthetic user panel. */
export type SimulationResult = {
  panelSize: number;
  wouldAdopt: number;
  unsure: number;
  wouldNot: number;
  personaNotes: string[];
  objections: Objection[];
  strongestObjection: string;
  adjustments: string[];
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export type StageId =
  | "brainstorm"
  | "research"
  | "analyze"
  | "simulate"
  | "build";
export type StageStatus =
  | "idle"
  | "running"
  | "done"
  | "error"
  | "cancelled"
  | "blocked";

export type StageState = { status: StageStatus; error?: string };
export type Stages = Record<StageId, StageState>;

export const IDLE_STAGES: Stages = {
  brainstorm: { status: "idle" },
  research: { status: "idle" },
  analyze: { status: "idle" },
  simulate: { status: "idle" },
  build: { status: "idle" },
};

/** Everything the workspace needs to rehydrate after a refresh. */
export type PipelineSnapshot = {
  idea: string;
  stages: Stages;
  brainstorm: BrainstormResult | null;
  chosenFraming: Framing | null;
  research: ResearchResult | null;
  analysis: AnalysisResult | null;
  simulation: SimulationResult | null;
  files: GeneratedFile[];
  buildLog: string[];
};

/** Server-sent event payloads emitted by /api/agents/build. */
export type BuildEvent =
  | { type: "status"; message: string }
  | { type: "file"; file: GeneratedFile }
  | { type: "note"; message: string }
  | { type: "done"; fileCount: number }
  | { type: "error"; message: string };
