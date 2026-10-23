"use client";

import React from "react";
import { SecurityAnalytics } from "../../components/SecurityAnalytics";
import { useTelemetry } from "../../hooks/useTelemetry";
import {
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

const REGISTERED_TOOLS = [
  "execute_transfer",
  "read_invoice",
  "create_user_record",
  "delete_record",
  "send_email",
  "check_balance",
];

export default function SecurityAnalyticsPage() {
  const {
    events,
    auditHistory,
    transactions,
    transactionSteps,
    refreshBackendRecords,
  } = useTelemetry();

  const totalAudit = auditHistory.length;
  const auditAllowed = auditHistory.filter(
    (r) => r.verdict === "ALLOWED"
  ).length;
  const auditBlocked = auditHistory.filter(
    (r) => r.verdict === "BLOCKED"
  ).length;
  const allowRate =
    totalAudit > 0 ? Math.round((auditAllowed / totalAudit) * 100) : 0;

  const txCompleted = transactions.filter(
    (t) => t.status === "COMPLETED"
  ).length;
  const txRolledBack = transactions.filter(
    (t) => t.status === "ROLLED_BACK"
  ).length;
  const txBlocked = transactions.filter((t) => t.status === "BLOCKED").length;

  const toolDistribution = REGISTERED_TOOLS.map((toolName) => {
    const rows = auditHistory.filter((r) => r.tool_name === toolName);
    const allowedCount = rows.filter((r) => r.verdict === "ALLOWED").length;
    const blockedCount = rows.filter((r) => r.verdict === "BLOCKED").length;
    return {
      toolName,
      total: rows.length,
      allowed: allowedCount,
      blocked: blockedCount,
    };
  });

  // Categorize denial reasons from persisted audit records
  const replayBlocks = auditHistory.filter((r) =>
    r.reason?.toLowerCase().includes("replay")
  ).length;
  const guardrailBlocks = auditHistory.filter((r) =>
    r.reason?.toLowerCase().includes("guardrail")
  ).length;
  const expiredBlocks = auditHistory.filter((r) =>
    r.reason?.toLowerCase().includes("expired")
  ).length;
  const mismatchOrMissingBlocks = auditHistory.filter(
    (r) =>
      r.verdict === "BLOCKED" &&
      !r.reason?.toLowerCase().includes("replay") &&
      !r.reason?.toLowerCase().includes("guardrail") &&
      !r.reason?.toLowerCase().includes("expired")
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
            Monitor
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
            Security Analytics
          </h1>
          <p className="mt-1 text-sm text-[#697386]">
            Security Analytics & Metrics — aggregated security statistics,
            verdict distributions, and operational telemetry insights.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshBackendRecords}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#172033] shadow-2xs transition hover:border-[#d3c7ff]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#7047eb]" />
          Refresh Metrics
        </button>
      </div>

      {/* Benchmark Security Analytics & Metrics Component */}
      <section className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              Platform Security Metrics Summary
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Aggregated telemetry insights, threat blocks, and protocol
              enforcement performance
            </p>
          </div>
          <BarChart3 className="h-5 w-5 text-[#7047eb]" />
        </div>
        <SecurityAnalytics />
      </section>

      {/* Persisted Database & Session Operational Breakdown */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Verdict & Denial Reason Distribution */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              Audit Verdict & Threat Block Distribution
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Computed from {totalAudit} persisted SQLite audit_events records
              and {events.length} session SSE events
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5">
              <span className="text-[11px] font-semibold text-[#697386]">
                Total Evaluated
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#172033]">
                {totalAudit}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
              <span className="text-[11px] font-semibold text-emerald-700">
                Allowed ({allowRate}%)
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                {auditAllowed}
              </p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
              <span className="text-[11px] font-semibold text-rose-700">
                Blocked ({totalAudit > 0 ? 100 - allowRate : 0}%)
              </span>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700">
                {auditBlocked}
              </p>
            </div>
          </div>

          {/* Visual Ratio Bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className="text-emerald-700">
                Allowed Verdicts ({auditAllowed})
              </span>
              <span className="text-rose-700">
                Blocked Verdicts ({auditBlocked})
              </span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#f0f1f6]">
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${totalAudit > 0 ? (auditAllowed / totalAudit) * 100 : 50}%`,
                }}
              />
              <div
                className="bg-rose-500 transition-all duration-300"
                style={{
                  width: `${totalAudit > 0 ? (auditBlocked / totalAudit) * 100 : 50}%`,
                }}
              />
            </div>
          </div>

          {/* Denial Category Breakdown */}
          <div className="space-y-2.5 border-t border-[#edf0f5] pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#697386]">
              Block Vector Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-2">
                <span className="text-[#465066]">Guardrail Intervened</span>
                <span className="font-mono font-bold text-rose-600">
                  {guardrailBlocks}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-2">
                <span className="text-[#465066]">Nonce Replay Detected</span>
                <span className="font-mono font-bold text-rose-600">
                  {replayBlocks}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-2">
                <span className="text-[#465066]">Token TTL Expired</span>
                <span className="font-mono font-bold text-rose-600">
                  {expiredBlocks}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-2">
                <span className="text-[#465066]">Scope / Action Mismatch</span>
                <span className="font-mono font-bold text-rose-600">
                  {mismatchOrMissingBlocks}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Saga Transaction Outcome Distribution */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              Saga Transaction & Step Execution Metrics
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Persisted state across {transactions.length} transactions and{" "}
              {transactionSteps.length} recorded execution steps
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#697386]">
                  Committed
                </span>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[#172033]">
                {txCompleted}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8790a2]">
                Status: COMPLETED
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#697386]">
                  Rolled Back
                </span>
                <RotateCcw className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[#172033]">
                {txRolledBack}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8790a2]">
                Status: ROLLED_BACK
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#697386]">
                  Steps Logged
                </span>
                <ShieldAlert className="h-4 w-4 text-[#7047eb]" />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[#172033]">
                {transactionSteps.length}
              </p>
              <p className="mt-0.5 text-[11px] text-[#8790a2]">
                {
                  transactionSteps.filter((s) => s.status === "COMPENSATED")
                    .length
                }{" "}
                compensated ({txBlocked} blocked)
              </p>
            </div>
          </div>

          {/* Tool Invocation Breakdown Table */}
          <div className="border-t border-[#edf0f5] pt-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#697386]">
              Evaluations by Registered MCP Tool
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#edf0f5] text-[11px] font-semibold uppercase text-[#8790a2]">
                    <th className="pb-2">Tool Name</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Allowed</th>
                    <th className="pb-2 text-right">Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f1f6]">
                  {toolDistribution.map((row) => (
                    <tr key={row.toolName}>
                      <td className="py-2 font-mono font-semibold text-[#172033]">
                        {row.toolName}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-[#465066]">
                        {row.total}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-emerald-700">
                        {row.allowed}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold text-rose-600">
                        {row.blocked}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
