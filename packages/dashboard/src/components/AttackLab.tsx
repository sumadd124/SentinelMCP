"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  LoaderCircle,
  RotateCcw,
  KeyRound,
  Clock,
  LockKeyhole,
  CheckCircle2,
  XCircle,
  Terminal,
  Database,
} from "lucide-react";
import { getGatewayBaseUrl } from "../hooks/useTelemetry";

export type ScenarioId =
  | "TOKEN_REPLAY"
  | "UNAUTHORIZED_ACCESS"
  | "EXPIRED_TOKEN"
  | "SAGA_ROLLBACK";

interface TimelineItem {
  timestamp: string;
  step: string;
  status: string;
  detail: string;
}

interface ScenarioExecutionResult {
  scenarioId: ScenarioId;
  title: string;
  attackStatus: string;
  finalVerdict: "ALLOWED" | "BLOCKED";
  transactionId?: string;
  finalTransactionStatus?: string;
  tokenInfo?: {
    tokenPreview: string;
    nonce: string;
    action: string;
    scope: string;
    expiresAt: string;
    signatureValid: boolean;
    nonceStatusAfterFirst: string;
  };
  stateVerification?: {
    initialBalance: number;
    midTransactionBalance: number;
    restoredBalance: number;
    createdRecordId: string;
    recordCompensatedAndRemoved: boolean;
    recordedSteps: Array<{
      step_order: number;
      tool_name: string;
      status: string;
    }>;
  };
  firstRequest: {
    step: string;
    verdict: "ALLOWED" | "BLOCKED";
    transactionId: string;
    detail: string;
    output?: Record<string, unknown>;
  };
  replayAttempt: {
    step: string;
    verdict: "ALLOWED" | "BLOCKED";
    transactionId: string;
    denialReason: string;
  };
  technicalExplanation: string;
  timeline: TimelineItem[];
}

const SCENARIOS: Array<{
  id: ScenarioId;
  code: string;
  name: string;
  subtitle: string;
  description: string;
}> = [
  {
    id: "TOKEN_REPLAY",
    code: "Scenario A",
    name: "Token Replay Attack",
    subtitle: "Single-use cryptographic nonce verification",
    description:
      "Issues a valid HMAC-SHA256 capability token, executes a legitimate transfer (consuming the UUIDv4 nonce in SQLite), and immediately replays the identical token.",
  },
  {
    id: "UNAUTHORIZED_ACCESS",
    code: "Scenario B",
    name: "Unauthorized Tool Access",
    subtitle: "Least-privilege action binding & prompt guardrails",
    description:
      "Executes an authorized read operation, then attempts privilege escalation by presenting a read-scoped token to a restricted financial action alongside a prompt injection payload.",
  },
  {
    id: "EXPIRED_TOKEN",
    code: "Scenario C",
    name: "Expired Capability Token",
    subtitle: "Strict zero-trust TTL enforcement",
    description:
      "Generates an authentically signed capability token whose TTL window expired 60 seconds ago, then submits a destructive deletion request to verify temporal rejection.",
  },
  {
    id: "SAGA_ROLLBACK",
    code: "Scenario D",
    name: "Transaction Failure & Saga Rollback",
    subtitle: "Multi-step atomic compensation in reverse order",
    description:
      "Runs a multi-step autonomous transaction, triggers a downstream guardrail failure on the final step, and executes reverse Saga compensations to restore account balances and remove temporary records.",
  },
];

export function AttackLab({ onScenarioComplete }: { onScenarioComplete?: () => void }) {
  const [selectedId, setSelectedId] = useState<ScenarioId>("TOKEN_REPLAY");
  const [runningId, setRunningId] = useState<ScenarioId | "ALL" | null>(null);
  const [resultsByScenario, setResultsByScenario] = useState<
    Partial<Record<ScenarioId, ScenarioExecutionResult>>
  >({});
  const [error, setError] = useState<string | null>(null);

  async function executeScenario(scenarioId: ScenarioId) {
    setError(null);
    setRunningId(scenarioId);
    setSelectedId(scenarioId);

    try {
      const res = await fetch(`${getGatewayBaseUrl()}/api/attack-lab/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gateway returned ${res.status}: ${errBody}`);
      }

      const data: ScenarioExecutionResult = await res.json();
      setResultsByScenario((prev) => ({ ...prev, [scenarioId]: data }));
      onScenarioComplete?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed to execute scenario against gateway: ${err.message}`
          : "Gateway connection error"
      );
    } finally {
      setRunningId(null);
    }
  }

  async function runAllScenarios() {
    setError(null);
    setRunningId("ALL");
    try {
      for (const s of SCENARIOS) {
        const res = await fetch(`${getGatewayBaseUrl()}/api/attack-lab/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: s.id }),
        });
        if (res.ok) {
          const data: ScenarioExecutionResult = await res.json();
          setResultsByScenario((prev) => ({ ...prev, [s.id]: data }));
        }
      }
      onScenarioComplete?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Failed during batch execution: ${err.message}`
          : "Batch execution error"
      );
    } finally {
      setRunningId(null);
    }
  }

  const activeResult = resultsByScenario[selectedId];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#edf0f5] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[#172033]">
              Attack Lab
            </h3>
            <p className="mt-1 text-xs text-[#697386]">
              Execute controlled exploit scenarios against the SentinelMCP Gateway and inspect live cryptographic, guardrail, and Saga rollback responses.
            </p>
          </div>
        </div>

        <button
          onClick={runAllScenarios}
          disabled={runningId !== null}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7047eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5d36d6] disabled:opacity-60"
        >
          {runningId === "ALL" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run All Scenarios
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scenario Selector Cards */}
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {SCENARIOS.map((scenario) => {
          const result = resultsByScenario[scenario.id];
          const isSelected = selectedId === scenario.id;
          const isRunning = runningId === scenario.id || runningId === "ALL";

          return (
            <div
              key={scenario.id}
              onClick={() => setSelectedId(scenario.id)}
              className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition duration-150 ${
                isSelected
                  ? "border-[#7047eb] bg-[#faf8ff] shadow-sm ring-1 ring-[#7047eb]"
                  : "border-[#e7e9f0] bg-white hover:border-[#d3c7ff]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#7047eb]">
                    {scenario.code}
                  </span>
                  {result ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {result.attackStatus === "ROLLED_BACK_CLEANLY"
                        ? "ROLLED BACK"
                        : "BLOCKED"}
                    </span>
                  ) : (
                    <span className="rounded-md bg-[#f5f6fa] px-2 py-0.5 text-[10px] font-semibold text-[#8790a2]">
                      READY
                    </span>
                  )}
                </div>

                <h4 className="mt-2 font-bold text-[#172033]">
                  {scenario.name}
                </h4>
                <p className="mt-0.5 text-xs font-medium text-[#7047eb]">
                  {scenario.subtitle}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#697386]">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-4 border-t border-[#edf0f5] pt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    executeScenario(scenario.id);
                  }}
                  disabled={runningId !== null}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#7047eb] bg-white px-3 py-2 text-xs font-semibold text-[#7047eb] transition hover:bg-[#7047eb] hover:text-white disabled:opacity-50"
                >
                  {isRunning ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Run Simulation
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Execution Inspector Panel */}
      <div className="border-t border-[#edf0f5] bg-[#fafbfe] p-5 sm:p-6">
        {!activeResult ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d9d0ff] bg-white px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0ebff] text-[#7047eb]">
              <Terminal className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-[#172033]">
              Select & Run a Controlled Attack Scenario
            </h4>
            <p className="mt-1 max-w-md text-xs leading-5 text-[#697386]">
              Click <strong>Run Simulation</strong> on any scenario card above to execute real requests against the SentinelMCP Gateway and inspect the live cryptographic, policy, and database rollback telemetry.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Result Banner */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-bold text-[#172033]">
                    {activeResult.title}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    ATTACK {activeResult.finalVerdict}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {activeResult.attackStatus}
                  </span>
                </div>
                <p className="text-xs text-[#697386]">
                  Executed against live SentinelMCP Gateway · SQLite Ledger & SSE Telemetry Updated
                </p>
              </div>

              {activeResult.finalTransactionStatus && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800">
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  <span>
                    Ledger TX Status: {activeResult.finalTransactionStatus}
                  </span>
                </div>
              )}
            </div>

            {/* Request Comparison Grid: First Request vs Attack / Replay Attempt */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Step 1 / Initial State */}
              <div className="rounded-xl border border-[#e7e9f0] bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#697386]">
                    Initial Operation / Context
                  </span>
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    {activeResult.firstRequest.verdict}
                  </span>
                </div>
                <h5 className="mt-2 font-bold text-sm text-[#172033]">
                  {activeResult.firstRequest.step}
                </h5>
                <p className="mt-1.5 text-xs leading-5 text-[#697386]">
                  {activeResult.firstRequest.detail}
                </p>
                <p className="mt-2 font-mono text-[11px] text-[#8790a2]">
                  TX ID: {activeResult.firstRequest.transactionId}
                </p>
              </div>

              {/* Step 2 / Attack Intercepted */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                    Adversarial Attempt Result
                  </span>
                  <span className="rounded-md border border-rose-300 bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
                    {activeResult.replayAttempt.verdict}
                  </span>
                </div>
                <h5 className="mt-2 font-bold text-sm text-[#172033]">
                  {activeResult.replayAttempt.step}
                </h5>
                <div className="mt-2 rounded-lg border border-rose-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                    Gateway Denial Reason:
                  </p>
                  <p className="mt-1 font-mono text-xs text-rose-700">
                    {activeResult.replayAttempt.denialReason}
                  </p>
                </div>
                <p className="mt-2 font-mono text-[11px] text-[#8790a2]">
                  TX ID: {activeResult.replayAttempt.transactionId}
                </p>
              </div>
            </div>

            {/* Token Validity or Saga Rollback Verification Details */}
            {activeResult.tokenInfo && (
              <div className="rounded-xl border border-[#e7e9f0] bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#7047eb]" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Capability Token Cryptographic Inspection
                  </h5>
                </div>
                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <span className="block text-[10px] font-semibold uppercase text-[#8790a2]">
                      HMAC-SHA256 Signature
                    </span>
                    <span className="mt-1 inline-block font-semibold text-emerald-700">
                      {activeResult.tokenInfo.signatureValid
                        ? "Valid Signature"
                        : "Invalid Signature"}
                    </span>
                    <code className="mt-1 block truncate font-mono text-[10px] text-[#697386]">
                      {activeResult.tokenInfo.tokenPreview}
                    </code>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <span className="block text-[10px] font-semibold uppercase text-[#8790a2]">
                      UUIDv4 Nonce Status
                    </span>
                    <span className="mt-1 inline-block font-mono font-bold text-rose-600">
                      {activeResult.tokenInfo.nonceStatusAfterFirst}
                    </span>
                    <code className="mt-1 block truncate font-mono text-[10px] text-[#697386]">
                      {activeResult.tokenInfo.nonce}
                    </code>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <span className="block text-[10px] font-semibold uppercase text-[#8790a2]">
                      Authorized Action & Scope
                    </span>
                    <span className="mt-1 block font-mono font-bold text-[#7047eb]">
                      {activeResult.tokenInfo.action}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] text-[#697386]">
                      {activeResult.tokenInfo.scope}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[#f7f8fc] p-3">
                    <span className="block text-[10px] font-semibold uppercase text-[#8790a2]">
                      Expiration Timestamp
                    </span>
                    <span className="mt-1 block font-mono font-semibold text-[#172033]">
                      {new Date(activeResult.tokenInfo.expiresAt).toLocaleTimeString()}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#697386]">
                      {activeResult.tokenInfo.expiresAt}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeResult.stateVerification && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-600" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Saga Rollback & SQLite State Verification
                  </h5>
                </div>
                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-4">
                  <div className="rounded-lg border border-[#e7e9f0] bg-white p-3">
                    <span className="block text-[10px] font-semibold uppercase text-[#8790a2]">
                      Initial ACC_1001 Balance
                    </span>
                    <span className="mt-1 block text-lg font-bold text-[#172033]">
                      ${activeResult.stateVerification.initialBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-white p-3">
                    <span className="block text-[10px] font-semibold uppercase text-amber-700">
                      Mid-Saga Balance (Step 3)
                    </span>
                    <span className="mt-1 block text-lg font-bold text-amber-600">
                      ${activeResult.stateVerification.midTransactionBalance.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#8790a2]">
                      After $250 debit before Step 4 failure
                    </span>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">
                    <span className="block text-[10px] font-semibold uppercase text-emerald-700">
                      Post-Rollback Balance
                    </span>
                    <span className="mt-1 block text-lg font-bold text-emerald-600">
                      ${activeResult.stateVerification.restoredBalance.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Automatically refunded by Saga
                    </span>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">
                    <span className="block text-[10px] font-semibold uppercase text-emerald-700">
                      Record {activeResult.stateVerification.createdRecordId}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-emerald-600">
                      {activeResult.stateVerification.recordCompensatedAndRemoved
                        ? "Compensated & Deleted"
                        : "Still Present"}
                    </span>
                    <span className="text-[10px] text-[#8790a2]">
                      Reverse step compensation verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Timeline & Technical Explanation */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-[#e7e9f0] bg-white p-5 lg:col-span-2">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#7047eb]" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Live Scenario Execution Timeline
                  </h5>
                </div>
                <div className="relative ml-2 space-y-4 border-l-2 border-[#e7e9f0] pl-4">
                  {activeResult.timeline.map((item, idx) => {
                    const isBlocked = item.status === "BLOCKED";
                    const isRollback =
                      item.status === "COMPENSATED" ||
                      item.status === "ROLLED_BACK";
                    return (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${
                            isBlocked
                              ? "bg-rose-500"
                              : isRollback
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#172033]">
                              {item.step}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                isBlocked
                                  ? "bg-rose-50 text-rose-700"
                                  : isRollback
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#8790a2]">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-[#697386]">
                          {item.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-[#e7e9f0] bg-[#201448] p-5 text-white">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                    <LockKeyhole className="h-4 w-4" />
                    Security Architecture Analysis
                  </div>
                  <h5 className="mt-3 text-base font-bold">
                    Why SentinelMCP Blocked This Threat
                  </h5>
                  <p className="mt-2 text-xs leading-6 text-violet-100/90">
                    {activeResult.technicalExplanation}
                  </p>
                </div>
                <div className="mt-6 border-t border-violet-800/60 pt-3 text-[11px] text-violet-300">
                  Verified via real backend execution
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
