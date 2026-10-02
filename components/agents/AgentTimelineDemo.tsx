"use client";

import { useEffect, useRef, useState } from "react";
import { AgentTimeline } from "./AgentTimeline";
import type { AgentStep } from "@/types/contracts";

function createSteps(): AgentStep[] {
  return [
    {
      id: "policy",
      name: "Policy Extraction",
      description: "Read sample policy rules.",
      status: "waiting",
    },
    {
      id: "evaluation",
      name: "Rule Evaluation",
      description: "Check the sample expense case.",
      status: "waiting",
    },
    {
      id: "action",
      name: "Action Generation",
      description: "Prepare a sample approval request.",
      status: "waiting",
    },
    {
      id: "automation",
      name: "Optional Automation",
      description: "Simulate webhook delivery without sending a request.",
      status: "waiting",
    },
  ];
}

export function AgentTimelineDemo() {
  const [steps, setSteps] = useState<AgentStep[]>(createSteps);
  const [running, setRunning] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [message, setMessage] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRun = useRef(0);

  useEffect(() => {
    return () => {
      activeRun.current += 1;
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function reset() {
    activeRun.current += 1;

    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setSteps(createSteps());
    setRunning(false);
    setMessage("");
  }

  function runDemo() {
    if (running) return;

    const runId = ++activeRun.current;
    const shouldFail = simulateFailure;

    setSteps(createSteps());
    setRunning(true);
    setMessage("");

    function runStep(index: number) {
      if (runId !== activeRun.current) return;

      setSteps((current) =>
        current.map((step, stepIndex) =>
          stepIndex === index
            ? {
                ...step,
                status: "running",
                startedAt: new Date().toISOString(),
              }
            : step,
        ),
      );

      timer.current = setTimeout(() => {
        if (runId !== activeRun.current) return;

        const failed = shouldFail && index === 3;

        setSteps((current) =>
          current.map((step, stepIndex) =>
            stepIndex === index
              ? {
                  ...step,
                  status: failed ? "failed" : "completed",
                  completedAt: new Date().toISOString(),
                  description: failed
                    ? "Simulated webhook failure. Sample draft remains available."
                    : step.description,
                  error: failed ? "Simulated delivery failure" : undefined,
                }
              : step,
          ),
        );

        if (index < 3) {
          runStep(index + 1);
        } else {
          timer.current = null;
          setRunning(false);
          setMessage(
            failed
              ? "Mock run finished. Optional automation failed; sample draft remains available."
              : "All mock steps completed successfully.",
          );
        }
      }, 1000);
    }

    runStep(0);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-400">
        Mock simulation only — no AI, case evaluation or webhook requests.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runDemo}
          disabled={running}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Running..." : "Run Demo"}
        </button>

        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Reset
        </button>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={simulateFailure}
            disabled={running}
            onChange={(event) => setSimulateFailure(event.target.checked)}
            className="accent-indigo-500"
          />
          Simulate webhook failure
        </label>
      </div>

      <AgentTimeline steps={steps} />

      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm text-zinc-300"
      >
        {message}
      </p>
    </div>
  );
}