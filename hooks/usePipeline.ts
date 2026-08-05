"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IDLE_STAGES,
  type AnalysisResult,
  type BrainstormResult,
  type BuildEvent,
  type Framing,
  type GeneratedFile,
  type MarketingResult,
  type PipelineSnapshot,
  type ResearchResult,
  type SimulationResult,
  type StageId,
  type StageStatus,
  type Stages,
} from "@/lib/types";

/** Seconds the user gets to override the top framing before it auto-runs. */
export const AUTO_PICK_SECONDS = 6;

const STORAGE_PREFIX = "multiplyer:session:";

function storageKey(idea: string) {
  return STORAGE_PREFIX + idea;
}

/** A run that was interrupted by a refresh is not still running. */
function settle(stages: Stages): Stages {
  const out = { ...stages };
  for (const id of Object.keys(out) as StageId[]) {
    if (out[id].status === "running") {
      out[id] = { status: "error", error: "Interrupted by a page reload." };
    }
  }
  return out;
}

function load(idea: string): PipelineSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    // localStorage, not sessionStorage: a run that cost real model usage must
    // survive a browser restart — re-running it because the tab closed would
    // spend the user's money to recompute a result they already had.
    const raw = localStorage.getItem(storageKey(idea));
    if (!raw) return null;
    const snap = JSON.parse(raw) as PipelineSnapshot;
    // Snapshots from before the current stage set lack keys; a partial
    // restore would crash the UI, so start those sessions fresh.
    if (!snap.stages?.analyze || !snap.stages?.simulate || !snap.stages?.market)
      return null;
    return { ...snap, stages: settle(snap.stages) };
  } catch {
    return null;
  }
}

/**
 * Agent calls run on Multiplyer's hosted API when the desktop shell says so
 * (our provider keys live server-side, never in the binary). On the web and
 * in mock mode the base is "" and everything stays same-origin.
 */
let apiBasePromise: Promise<string> | null = null;
function apiBase(): Promise<string> {
  apiBasePromise ??= (async () => {
    try {
      const bridge = (
        window as { multiplyer?: { apiBase?: () => Promise<string> } }
      ).multiplyer;
      return (await bridge?.apiBase?.()) ?? "";
    } catch {
      return "";
    }
  })();
  return apiBasePromise;
}

async function postJson<T>(
  url: string,
  body: unknown,
  signal: AbortSignal,
): Promise<T> {
  const res = await fetch((await apiBase()) + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data as T;
}

export function usePipeline(idea: string) {
  // Restore synchronously via lazy initialisers rather than in an effect —
  // an effect would cause a cascading second render. Safe from hydration
  // mismatch because useSearchParams already forces this subtree to render
  // on the client only. These initialisers run top-down, so `boot` is
  // available to the ones below it.
  const [boot] = useState<PipelineSnapshot | null>(() =>
    idea ? load(idea) : null,
  );
  // A fresh session starts brainstorming immediately, so "running" is the
  // initial state rather than something the boot effect has to set.
  const [stages, setStages] = useState<Stages>(
    () =>
      boot?.stages ?? { ...IDLE_STAGES, brainstorm: { status: "running" } },
  );
  const [brainstorm, setBrainstorm] = useState<BrainstormResult | null>(
    () => boot?.brainstorm ?? null,
  );
  const [chosenFraming, setChosenFraming] = useState<Framing | null>(
    () => boot?.chosenFraming ?? null,
  );
  const [research, setResearch] = useState<ResearchResult | null>(
    () => boot?.research ?? null,
  );
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    () => boot?.analysis ?? null,
  );
  const [simulation, setSimulation] = useState<SimulationResult | null>(
    () => boot?.simulation ?? null,
  );
  const [files, setFiles] = useState<GeneratedFile[]>(() => boot?.files ?? []);
  const [buildLog, setBuildLog] = useState<string[]>(() => boot?.buildLog ?? []);
  const [marketing, setMarketing] = useState<MarketingResult | null>(
    () => boot?.marketing ?? null,
  );
  const restored = boot !== null;

  const booted = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const autoPick = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest values for handlers that run outside React's render cycle.
  const data = useRef<{
    framing: Framing | null;
    research: ResearchResult | null;
    analysis: AnalysisResult | null;
    simulation: SimulationResult | null;
  }>({ framing: null, research: null, analysis: null, simulation: null });

  const setStage = useCallback(
    (id: StageId, status: StageStatus, error?: string) =>
      setStages((s) => ({ ...s, [id]: { status, error } })),
    [],
  );

  const clearAutoPick = useCallback(() => {
    if (autoPick.current) {
      clearTimeout(autoPick.current);
      autoPick.current = null;
    }
  }, []);

  /** Abort any in-flight request and mark whatever was running as cancelled. */
  const cancel = useCallback(() => {
    clearAutoPick();
    abort.current?.abort();
    abort.current = null;
    setStages((s) => {
      const out = { ...s };
      for (const id of Object.keys(out) as StageId[]) {
        if (out[id].status === "running") out[id] = { status: "cancelled" };
      }
      return out;
    });
  }, [clearAutoPick]);

  const freshSignal = useCallback(() => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    return ctrl.signal;
  }, []);

  // ---- individual stages -------------------------------------------------

  const runMarket = useCallback(
    async (
      framing: Framing,
      analysisResult: AnalysisResult,
      simulationResult: SimulationResult | null,
      signal: AbortSignal,
    ) => {
      setStage("market", "running");
      const result = await postJson<MarketingResult>(
        "/api/agents/market",
        {
          framing,
          analysis: analysisResult,
          simulation: simulationResult,
          research: data.current.research,
        },
        signal,
      );
      setMarketing(result);
      setStage("market", "done");
    },
    [setStage],
  );

  const runBuild = useCallback(
    async (
      framing: Framing,
      analysisResult: AnalysisResult,
      simulationResult: SimulationResult | null,
      signal: AbortSignal,
    ) => {
      setStage("build", "running");
      setFiles([]);
      setBuildLog(["> builder agent invoked"]);

      const res = await fetch((await apiBase()) + "/api/agents/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framing,
          analysis: analysisResult,
          simulation: simulationResult,
        }),
        signal,
      });
      if (!res.body) throw new Error("No stream returned by builder agent");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let failed: string | null = null;
      let finished = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          let event: BuildEvent;
          try {
            event = JSON.parse(line.slice(6)) as BuildEvent;
          } catch {
            continue;
          }

          if (event.type === "file") {
            setFiles((prev) => [
              ...prev.filter((f) => f.path !== event.file.path),
              event.file,
            ]);
            setBuildLog((l) => [...l, `> wrote ${event.file.path}`]);
          } else if (event.type === "status" || event.type === "note") {
            setBuildLog((l) => [...l, `> ${event.message}`]);
          } else if (event.type === "done") {
            finished = true;
            setBuildLog((l) => [
              ...l,
              `> done — ${event.fileCount} file(s) generated`,
            ]);
          } else if (event.type === "error") {
            failed = event.message;
          }
        }
      }

      if (failed) throw new Error(failed);
      if (!finished) {
        throw new Error("Builder stream ended before the agent finished.");
      }
      setStage("build", "done");
      await runMarket(framing, analysisResult, simulationResult, signal);
    },
    [runMarket, setStage],
  );

  const runSimulate = useCallback(
    async (
      framing: Framing,
      researchResult: ResearchResult,
      analysisResult: AnalysisResult,
      signal: AbortSignal,
    ) => {
      setStage("simulate", "running");
      const sim = await postJson<SimulationResult>(
        "/api/agents/simulate",
        { framing, research: researchResult, analysis: analysisResult },
        signal,
      );
      data.current.simulation = sim;
      setSimulation(sim);
      setStage("simulate", "done");
      await runBuild(framing, analysisResult, sim, signal);
    },
    [runBuild, setStage],
  );

  const runAnalyze = useCallback(
    async (
      framing: Framing,
      researchResult: ResearchResult,
      signal: AbortSignal,
    ) => {
      setStage("analyze", "running");
      const verdict = await postJson<AnalysisResult>(
        "/api/agents/analyze",
        { framing, research: researchResult },
        signal,
      );
      data.current.analysis = verdict;
      setAnalysis(verdict);
      setStage("analyze", "done");

      // The gate: anything short of "build" stops the pipeline here — there
      // is no point simulating or building a framing the analysis rejected.
      if (verdict.verdict !== "build") {
        setStage("simulate", "blocked");
        setStage("build", "blocked");
        setStage("market", "blocked");
        return;
      }
      await runSimulate(framing, researchResult, verdict, signal);
    },
    [runSimulate, setStage],
  );

  const runResearch = useCallback(
    async (framing: Framing, signal: AbortSignal) => {
      setStage("research", "running");
      const result = await postJson<ResearchResult>(
        "/api/agents/research",
        { framing },
        signal,
      );
      data.current.research = result;
      setResearch(result);
      setStage("research", "done");
      await runAnalyze(framing, result, signal);
    },
    [runAnalyze, setStage],
  );

  /** Callers own the "running" transition — see the stages initialiser. */
  const runBrainstorm = useCallback(
    async (signal: AbortSignal) => {
      const result = await postJson<BrainstormResult>(
        "/api/agents/brainstorm",
        { idea },
        signal,
      );
      setBrainstorm(result);
      setStage("brainstorm", "done");
      return result;
    },
    [idea, setStage],
  );

  /** Route thrown errors to the stage that was actually running. */
  const attribute = useCallback((err: unknown) => {
    // An abort is a user action, not a failure — cancel() already set state.
    if (err instanceof DOMException && err.name === "AbortError") return;
    const message = err instanceof Error ? err.message : String(err);
    setStages((s) => {
      const out = { ...s };
      for (const id of Object.keys(out) as StageId[]) {
        if (out[id].status === "running")
          out[id] = { status: "error", error: message };
      }
      return out;
    });
  }, []);

  // ---- public actions ----------------------------------------------------

  /** Commit to a framing and run research -> analyze -> simulate -> build. */
  const chooseFraming = useCallback(
    (framing: Framing) => {
      clearAutoPick();
      data.current = {
        framing,
        research: null,
        analysis: null,
        simulation: null,
      };
      setChosenFraming(framing);
      setResearch(null);
      setAnalysis(null);
      setSimulation(null);
      setFiles([]);
      setBuildLog([]);
      setMarketing(null);
      setStages((s) => ({
        ...s,
        research: { status: "running" },
        analyze: { status: "idle" },
        simulate: { status: "idle" },
        build: { status: "idle" },
        market: { status: "idle" },
      }));
      const signal = freshSignal();
      runResearch(framing, signal).catch(attribute);
    },
    [attribute, clearAutoPick, freshSignal, runResearch],
  );

  /** Go back to the framing list without losing the brainstorm. */
  const reconsider = useCallback(() => {
    cancel();
    data.current = {
      framing: null,
      research: null,
      analysis: null,
      simulation: null,
    };
    setChosenFraming(null);
    setResearch(null);
    setAnalysis(null);
    setSimulation(null);
    setFiles([]);
    setBuildLog([]);
    setMarketing(null);
    setStages((s) => ({
      ...s,
      research: { status: "idle" },
      analyze: { status: "idle" },
      simulate: { status: "idle" },
      build: { status: "idle" },
      market: { status: "idle" },
    }));
  }, [cancel]);

  /** Re-run one stage and everything downstream of it. */
  const retry = useCallback(
    (from: StageId) => {
      const signal = freshSignal();
      const framing = data.current.framing;

      if (from === "brainstorm") {
        setChosenFraming(null);
        setResearch(null);
        setAnalysis(null);
        setSimulation(null);
        setFiles([]);
        setBuildLog([]);
        setMarketing(null);
        setStages({ ...IDLE_STAGES, brainstorm: { status: "running" } });
        data.current = {
          framing: null,
          research: null,
          analysis: null,
          simulation: null,
        };
        runBrainstorm(signal)
          .then((result) => {
            const top = result.framings[0];
            if (top) {
              autoPick.current = setTimeout(
                () => chooseFraming(top),
                AUTO_PICK_SECONDS * 1000,
              );
            }
          })
          .catch(attribute);
        return;
      }

      if (!framing) return;

      if (from === "research") {
        chooseFraming(framing);
        return;
      }

      if (from === "analyze") {
        const r = data.current.research;
        if (!r) return;
        setAnalysis(null);
        setSimulation(null);
        setFiles([]);
        setBuildLog([]);
        setMarketing(null);
        setStages((s) => ({
          ...s,
          analyze: { status: "running" },
          simulate: { status: "idle" },
          build: { status: "idle" },
          market: { status: "idle" },
        }));
        runAnalyze(framing, r, signal).catch(attribute);
        return;
      }

      if (from === "simulate") {
        const r = data.current.research;
        const a = data.current.analysis;
        if (!r || !a) return;
        setSimulation(null);
        setFiles([]);
        setBuildLog([]);
        setMarketing(null);
        setStages((s) => ({
          ...s,
          simulate: { status: "running" },
          build: { status: "idle" },
          market: { status: "idle" },
        }));
        runSimulate(framing, r, a, signal).catch(attribute);
        return;
      }

      const a = data.current.analysis;
      if (!a) return;

      if (from === "market") {
        runMarket(framing, a, data.current.simulation, signal).catch(
          attribute,
        );
        return;
      }

      setMarketing(null);
      setStages((s) => ({ ...s, market: { status: "idle" } }));
      runBuild(framing, a, data.current.simulation, signal).catch(attribute);
    },
    [
      attribute,
      chooseFraming,
      freshSignal,
      runAnalyze,
      runBrainstorm,
      runBuild,
      runMarket,
      runSimulate,
    ],
  );

  /**
   * Deliberate escape hatch: build despite an iterate/kill verdict.
   * Skips the simulation (no point pressure-testing a framing the analysis
   * rejected) and goes straight to the builder. Kept subordinate in the UI —
   * the gate is the product, but a dead end is worse than an informed
   * override.
   */
  const buildAnyway = useCallback(() => {
    const framing = data.current.framing;
    const a = data.current.analysis;
    if (!framing || !a) return;
    const signal = freshSignal();
    runBuild(framing, a, null, signal).catch(attribute);
  }, [attribute, freshSignal, runBuild]);

  // ---- boot & persistence ------------------------------------------------

  // Mirror restorable state into the ref the async handlers read from.
  // No setState here, so this never triggers a re-render.
  useEffect(() => {
    data.current = { framing: chosenFraming, research, analysis, simulation };
  }, [chosenFraming, research, analysis, simulation]);

  useEffect(() => {
    if (!idea || booted.current) return;
    booted.current = true;

    // A restored session already has its results; don't re-run the agent.
    if (boot) return;

    const signal = freshSignal();
    // Firing the first request on mount is the one case this rule cannot
    // distinguish from a render loop. Nothing is set synchronously here: every
    // state change happens after an await, and `booted` runs this exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runBrainstorm(signal)
      .then((result) => {
        const top = result.framings[0];
        if (top) {
          autoPick.current = setTimeout(
            () => chooseFraming(top),
            AUTO_PICK_SECONDS * 1000,
          );
        }
      })
      .catch(attribute);
  }, [idea, boot, attribute, chooseFraming, freshSignal, runBrainstorm]);

  useEffect(
    () => () => {
      clearAutoPick();
      abort.current?.abort();
    },
    [clearAutoPick],
  );

  // Persist after every meaningful change so a refresh resumes where it left off.
  useEffect(() => {
    if (!idea || typeof window === "undefined") return;
    const snapshot: PipelineSnapshot = {
      idea,
      stages,
      brainstorm,
      chosenFraming,
      research,
      analysis,
      simulation,
      files,
      buildLog,
      marketing,
    };
    try {
      localStorage.setItem(storageKey(idea), JSON.stringify(snapshot));
    } catch {
      // Quota exceeded on a large generated project — persistence is a
      // convenience, never a correctness requirement.
    }
  }, [
    idea,
    stages,
    brainstorm,
    chosenFraming,
    research,
    analysis,
    simulation,
    files,
    buildLog,
    marketing,
  ]);

  const clearSession = useCallback(() => {
    cancel();
    try {
      localStorage.removeItem(storageKey(idea));
    } catch {
      /* ignore */
    }
  }, [cancel, idea]);

  const busy = (Object.keys(stages) as StageId[]).some(
    (id) => stages[id].status === "running",
  );

  return {
    stages,
    brainstorm,
    chosenFraming,
    research,
    analysis,
    simulation,
    files,
    buildLog,
    marketing,
    busy,
    restored,
    chooseFraming,
    reconsider,
    retry,
    buildAnyway,
    cancel,
    clearSession,
  };
}
