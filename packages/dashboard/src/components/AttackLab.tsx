"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  LoaderCircle,
} from "lucide-react";

type AttackResult = {
  name: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
};

const attacks = [
  {
    name: "Token Replay",
    description: "Reuse a previously consumed capability token.",
    expected: "Second use rejected",
  },
  {
    name: "Expired Token",
    description: "Attempt an action with an expired token.",
    expected: "Request rejected",
  },
  {
    name: "Unauthorized Action",
    description: "Use a token for a different action.",
    expected: "Permission mismatch rejected",
  },
  {
    name: "Prompt Injection",
    description: "Submit text containing a known injection pattern.",
    expected: "Guardrail blocks input",
  },
];

export function AttackLab() {
  const [results, setResults] = useState<AttackResult[]>([]);
  const [running, setRunning] = useState(false);

  function runSimulations() {
    setRunning(true);

    // UI-only simulations; no real attack or gateway request is performed.
    const simulated: AttackResult[] = attacks.map((attack) => ({
      name: attack.name,
      description: attack.description,
      expected: attack.expected,
      actual: "Simulation only — backend not tested",
      passed: false,
    }));

    setResults(simulated);
    setRunning(false);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-[#edf0f5] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight">Stage 11 · Attack Lab</h3>
            <p className="mt-1 text-xs text-[#8790a2]">
              Security scenarios for token and prompt protection
            </p>
          </div>
        </div>

        <button
          onClick={runSimulations}
          disabled={running}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#7047eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5d36d6] disabled:opacity-60"
        >
          {running ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run simulations
        </button>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
        {attacks.map((attack) => {
          const result = results.find((item) => item.name === attack.name);

          return (
            <div
              key={attack.name}
              className="rounded-xl border border-[#e9ebf2] p-4"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                <div className="min-w-0">
                  <h4 className="font-semibold text-[#263148]">
                    {attack.name}
                  </h4>
                  <p className="mt-1 text-sm leading-5 text-[#697386]">
                    {attack.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-[#f0f1f6] pt-3">
                <p className="text-xs text-[#8790a2]">
                  Expected: {attack.expected}
                </p>

                {result && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-amber-700">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{result.actual}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 border-t border-[#edf0f5] bg-[#fcfcfe] px-5 py-4 text-xs leading-5 text-[#697386] sm:px-6">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7047eb]" />
        <p>
          Safe preview only. These UI simulations do not execute backend
          security checks or prove that an attack was blocked.
        </p>
      </div>
    </section>
  );
}