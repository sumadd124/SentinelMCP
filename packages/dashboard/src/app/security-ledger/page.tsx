"use client";

import React, { useState } from "react";
import { useTelemetry } from "../../hooks/useTelemetry";
import {
  Database,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";

export default function SecurityLedgerPage() {
  const {
    auditHistory,
    transactions,
    transactionSteps,
    accounts,
    refreshBackendRecords,
  } = useTelemetry();

  const [verdictFilter, setVerdictFilter] = useState<
    "ALL" | "ALLOWED" | "BLOCKED"
  >("ALL");

  const filteredAudit = auditHistory.filter((row) => {
    if (verdictFilter === "ALL") return true;
    return row.verdict === verdictFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
            Audit & Compliance
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
            Persisted Security Ledger
          </h1>
          <p className="mt-1 text-sm text-[#697386]">
            Durable SQLite audit decisions, multi-step Saga transaction records,
            and account state balances.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshBackendRecords}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#172033] shadow-2xs transition hover:border-[#d3c7ff]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#7047eb]" />
          Sync SQLite Ledger
        </button>
      </div>

      {/* Persisted Account State Verification */}
      <section className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                SQLite Ledger Account State (mock_accounts)
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Verified balances across {auditHistory.length} audit entries and{" "}
                {transactions.length} persisted transactions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {accounts.length === 0 ? (
              <span className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-3.5 py-2 text-xs text-[#8790a2]">
                Connect gateway to load account balances
              </span>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.account_id}
                  className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-4 py-2 text-xs"
                >
                  <span className="font-mono font-semibold text-[#697386]">
                    {acc.account_id}:
                  </span>{" "}
                  <span className="font-mono font-bold text-[#172033]">
                    ${Number(acc.balance).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Persisted Audit Decisions & Saga Transactions Grid */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Audit Decisions Table */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Persisted Audit Decisions (audit_events)
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Showing {filteredAudit.length} of {auditHistory.length} database
                records
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {(["ALL", "ALLOWED", "BLOCKED"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setVerdictFilter(tab)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    verdictFilter === tab
                      ? "bg-[#7047eb] text-white"
                      : "border border-[#e7e9f0] bg-[#fcfcfe] text-[#697386] hover:text-[#172033]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
            {filteredAudit.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e7e9f0] p-8 text-center text-xs text-[#8790a2]">
                No persisted audit records match the selected filter. Run an
                Attack Lab scenario to populate the SQLite ledger.
              </div>
            ) : (
              filteredAudit.map((row) => (
                <div
                  key={row.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#edf0f5] bg-[#fcfcfe] p-3.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-[#8790a2]">
                        #{row.id}
                      </span>
                      <span className="font-mono font-bold text-[#7047eb]">
                        {row.tool_name || row.event_type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          row.verdict === "ALLOWED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {row.verdict === "ALLOWED" ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <ShieldAlert className="h-3 w-3" />
                        )}
                        {row.verdict}
                      </span>
                    </div>
                    {row.reason && (
                      <p className="mt-1.5 break-words text-[11px] leading-4 text-[#465066]">
                        {row.reason}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-[#8790a2]">
                    {new Date(row.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Saga Transactions Ledger */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              Persisted Saga Transactions (transactions)
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Multi-step execution records and reverse rollback verification (
              {transactions.length} transactions, {transactionSteps.length}{" "}
              steps)
            </p>
          </div>

          <div className="max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e7e9f0] p-8 text-center text-xs text-[#8790a2]">
                No persisted transactions in SQLite yet.
              </div>
            ) : (
              transactions.map((tx) => {
                const steps = transactionSteps.filter(
                  (s) => s.transaction_id === tx.id
                );
                return (
                  <div
                    key={tx.id}
                    className="rounded-xl border border-[#edf0f5] bg-[#fcfcfe] p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono font-bold text-[#172033]">
                          {tx.id}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#697386]">
                          Initiator: {tx.initiator || tx.client_id || "system"}{" "}
                          · {steps.length} recorded step(s)
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : tx.status === "ROLLED_BACK"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {tx.status === "ROLLED_BACK" && (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        {tx.status}
                      </span>
                    </div>

                    {steps.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[#edf0f5] pt-2">
                        {steps.map((s) => (
                          <span
                            key={s.id}
                            className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                              s.status === "COMPENSATED"
                                ? "border-amber-200 bg-amber-50 text-amber-800"
                                : "border-[#e7e9f0] bg-white text-[#465066]"
                            }`}
                          >
                            #{s.step_order} {s.tool_name} ({s.status})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
