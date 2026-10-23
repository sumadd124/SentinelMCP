"use client";

import React, { useState } from "react";
import { ForensicsTimeline } from "../../components/ForensicsTimeline";
import { useTelemetry } from "../../hooks/useTelemetry";
import {
  Clock,
  FileSearch,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export default function ForensicsPage() {
  const {
    transactions,
    transactionSteps,
    auditHistory,
    refreshBackendRecords,
  } = useTelemetry();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const activeTx =
    transactions.find((t) => t.id === selectedTxId) || transactions[0] || null;

  const activeSteps = activeTx
    ? transactionSteps.filter((s) => s.transaction_id === activeTx.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
            Investigate
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
            Forensics & Incident Timeline
          </h1>
          <p className="mt-1 text-sm text-[#697386]">
            Chronological reconstruction of MCP transactions, tool execution
            payloads, policy blocks, and reverse Saga compensations.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshBackendRecords}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#172033] shadow-2xs transition hover:border-[#d3c7ff]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#7047eb]" />
          Refresh Forensic Evidence
        </button>
      </div>

      {/* Live Transaction & Step Forensic Reconstruction */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Transaction Selector List */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Recorded Transactions
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Select a transaction to inspect step-level forensic payloads
              </p>
            </div>
            <span className="rounded-lg bg-[#f5f6fa] px-2.5 py-1 font-mono text-xs font-semibold text-[#697386]">
              {transactions.length}
            </span>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e7e9f0] p-6 text-center text-xs text-[#8790a2]">
                No persisted transactions found in SQLite. Run a simulation in
                Attack Lab to generate forensic traces.
              </div>
            ) : (
              transactions.map((tx) => {
                const isSelected = activeTx?.id === tx.id;
                const stepCount = transactionSteps.filter(
                  (s) => s.transaction_id === tx.id
                ).length;

                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedTxId(tx.id)}
                    className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? "border-[#7047eb] bg-[#faf8ff] ring-1 ring-[#7047eb]"
                        : "border-[#e7e9f0] bg-[#fcfcfe] hover:border-[#d3c7ff]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-bold text-[#172033]">
                        {tx.id}
                      </span>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "ROLLED_BACK"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#697386]">
                      <span>
                        Initiator: {tx.initiator || tx.client_id || "system"}
                      </span>
                      <span className="font-mono">{stepCount} step(s)</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-[#8790a2]">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Forensic Evidence Detail Panel */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs lg:col-span-7 sm:p-6">
          <div className="mb-4 flex items-center gap-3 border-b border-[#edf0f5] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Incident Context & Step Evidence
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                {activeTx
                  ? `Inspecting ${activeTx.id} (${activeTx.status})`
                  : "Select a transaction from the ledger"}
              </p>
            </div>
          </div>

          {!activeTx ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-xs text-[#8790a2]">
              No transaction selected.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f7f8fc] p-3">
                  <span className="text-[10px] font-bold uppercase text-[#8790a2]">
                    Transaction Status
                  </span>
                  <p className="mt-1 font-mono text-xs font-bold text-[#172033]">
                    {activeTx.status}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f7f8fc] p-3">
                  <span className="text-[10px] font-bold uppercase text-[#8790a2]">
                    Client / Initiator
                  </span>
                  <p className="mt-1 font-mono text-xs font-semibold text-[#7047eb]">
                    {activeTx.initiator || activeTx.client_id || "system"}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f7f8fc] p-3">
                  <span className="text-[10px] font-bold uppercase text-[#8790a2]">
                    Last Updated
                  </span>
                  <p className="mt-1 font-mono text-xs text-[#465066]">
                    {new Date(activeTx.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {activeSteps.length === 0 ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 text-xs text-rose-800">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    Pre-Execution Policy Rejection (0 Forward Steps Committed)
                  </div>
                  <p className="mt-1 text-[#465066]">
                    This transaction was intercepted and rolled back before any
                    mutating tool handler executed because capability
                    verification or content guardrails denied the request.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#697386]">
                    Recorded Execution Steps ({activeSteps.length})
                  </h3>
                  <div className="relative ml-2 space-y-4 border-l-2 border-[#e7e9f0] pl-4">
                    {activeSteps.map((step) => (
                      <div
                        key={step.id}
                        className="relative rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5"
                      >
                        <span
                          className={`absolute -left-[23px] top-4 h-3 w-3 rounded-full border-2 border-white ${
                            step.status === "COMPENSATED"
                              ? "bg-amber-500"
                              : step.status === "SUCCESS"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#f0ebff] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#7047eb]">
                              Step #{step.step_order}
                            </span>
                            <span className="font-mono text-xs font-bold text-[#172033]">
                              {step.tool_name}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                              step.status === "COMPENSATED"
                                ? "bg-amber-50 text-amber-700"
                                : step.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {step.status === "COMPENSATED" ? (
                              <RotateCcw className="h-3 w-3" />
                            ) : (
                              <ShieldCheck className="h-3 w-3" />
                            )}
                            {step.status}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase text-[#8790a2]">
                              Input Payload
                            </span>
                            <pre className="mt-1 max-h-24 overflow-auto rounded border border-[#edf0f5] bg-white p-2 font-mono text-[10px] text-[#465066]">
                              {step.input_payload}
                            </pre>
                          </div>
                          {step.output_payload && (
                            <div>
                              <span className="text-[10px] font-semibold uppercase text-[#8790a2]">
                                Output Snapshot
                              </span>
                              <pre className="mt-1 max-h-24 overflow-auto rounded border border-[#edf0f5] bg-white p-2 font-mono text-[10px] text-[#465066]">
                                {step.output_payload}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Chronological Incident & Reference Timeline */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Reference Saga Rollback Sequence
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Standard chronological lifecycle of a multi-step incident and
                compensation recovery
              </p>
            </div>
            <Clock className="h-5 w-5 text-[#7047eb]" />
          </div>
          <ForensicsTimeline />
        </div>

        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Chronological Audit Incident Log
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Recent gateway verdicts persisted in audit_events (
                {auditHistory.length} records)
              </p>
            </div>
          </div>

          <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
            {auditHistory.length === 0 ? (
              <p className="text-xs text-[#8790a2]">
                No persisted audit events yet.
              </p>
            ) : (
              auditHistory.slice(0, 15).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#edf0f5] bg-[#fcfcfe] p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#7047eb]">
                        {item.tool_name || item.event_type}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          item.verdict === "ALLOWED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.verdict}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#8790a2]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {item.reason && (
                    <p className="mt-1.5 text-[11px] leading-4 text-[#697386]">
                      {item.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
