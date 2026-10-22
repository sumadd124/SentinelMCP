"use client";

import { RiskIntelligence } from "../components/RiskIntelligence";
import { ForensicsTimeline } from "../components/ForensicsTimeline";
import { SecurityAnalytics } from "../components/SecurityAnalytics";
import { AttackLab } from "../components/AttackLab";
import { useTelemetry } from "../hooks/useTelemetry";
import { TokenGenerator } from "../components/TokenGenerator";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Trash2,
  Radio,
  ArrowUpRight,
  Zap,
  LockKeyhole,
  RotateCcw,
  CircleCheck,
  Clock3,
} from "lucide-react";

export default function DashboardPage() {
  const {
    events,
    auditHistory,
    transactions,
    accounts,
    isConnected,
    clearEvents,
    refreshBackendRecords,
  } = useTelemetry();

  const allowed = events.filter((e) => e.verdict === "ALLOWED").length;
  const blocked = events.filter(
    (e) => e.verdict === "BLOCKED" || e.type === "SAGA_ROLLBACK_INITIATED"
  ).length;
  const rollbacks = events.filter(
    (e) =>
      e.type === "SAGA_ROLLBACK_INITIATED" || e.type === "ROLLBACK_COMPLETED"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-5 text-[#172033] sm:px-7 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-[#e7e9f0] pb-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7047eb] text-white shadow-lg shadow-violet-200">
              <Shield className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Sentinel<span className="text-[#7047eb]">MCP</span>
              </h1>
              <p className="mt-1 text-sm text-[#697386]">
                Security command center <span className="mx-1.5">/</span> Overview
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#e7e9f0] bg-white px-4 py-2.5 shadow-sm">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "animate-pulse bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-semibold tracking-wide text-[#465066]">
                {isConnected ? "GATEWAY CONNECTED" : "GATEWAY DISCONNECTED"}
              </span>
            </div>

            <button
              onClick={clearEvents}
              title="Clear event history"
              className="flex items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#697386] shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear logs</span>
            </button>
          </div>
        </header>

        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7047eb]">
              Operations overview
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your agents. Under control.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#697386] sm:text-base">
              Monitor tool calls, enforce zero-trust policies, and inspect
              transaction activity in real time.
            </p>
          </div>
          <div className="flex items-center gap-2 pb-1 text-xs text-[#697386]">
            <Clock3 className="h-4 w-4" />
            Live telemetry
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Events observed"
            value={events.length}
            detail="Events received in this session"
            icon={<Activity className="h-5 w-5" />}
            accent="violet"
          />
          <MetricCard
            label="Requests allowed"
            value={allowed}
            detail="Passed security checks"
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="green"
          />
          <MetricCard
            label="Requests blocked"
            value={blocked}
            detail="Blocked or rollback-triggering events"
            icon={<LockKeyhole className="h-5 w-5" />}
            accent="rose"
          />
          <MetricCard
            label="Saga rollbacks"
            value={rollbacks}
            detail="Rollback events observed"
            icon={<RotateCcw className="h-5 w-5" />}
            accent="amber"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-sm xl:col-span-2">
            <div className="flex flex-col justify-between gap-3 border-b border-[#edf0f5] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Live security stream</h3>
                  <p className="mt-1 text-xs text-[#8790a2]">
                    Real-time gateway decisions and transaction events
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-lg bg-[#f5f6fa] px-3 py-1.5 text-xs font-semibold text-[#697386]">
                {events.length} events
              </span>
            </div>

            <div className="max-h-[480px] overflow-auto">
              {events.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ebff] text-[#7047eb]">
                    <Activity className="h-7 w-7" />
                  </div>
                  <h4 className="font-semibold">Waiting for gateway activity</h4>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#8790a2]">
                    Invoke an MCP tool or run an Attack Lab scenario below to see security decisions appear here.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#697386]">
                    <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {isConnected ? "Listening for events" : "Waiting for connection"}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#f0f1f6]">
                  {events.map((evt, idx) => (
                    <div
                      key={`${evt.timestamp}-${idx}`}
                      className="flex flex-col justify-between gap-3 px-5 py-4 transition hover:bg-[#fafaff] sm:flex-row sm:items-center sm:px-6"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            evt.verdict === "BLOCKED" ||
                            evt.type === "SAGA_ROLLBACK_INITIATED"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {evt.verdict === "BLOCKED" ||
                          evt.type === "SAGA_ROLLBACK_INITIATED" ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="break-all text-sm font-semibold text-[#263148]">
                              {evt.type}
                            </span>
                            {evt.verdict && (
                              <span
                                className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${
                                  evt.verdict === "ALLOWED"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                }`}
                              >
                                {evt.verdict}
                              </span>
                            )}
                          </div>
                          {evt.toolName && (
                            <p className="mt-1 text-xs text-[#7047eb]">
                              Tool · {evt.toolName}
                            </p>
                          )}
                          {evt.reason && (
                            <p
                              className={`mt-1 break-words text-xs leading-5 ${
                                evt.verdict === "BLOCKED" ||
                                evt.type === "SAGA_ROLLBACK_INITIATED"
                                  ? "text-rose-600"
                                  : "text-[#697386]"
                              }`}
                            >
                              {evt.reason}
                            </p>
                          )}
                          {evt.transactionId && (
                            <p className="mt-1 break-all font-mono text-[10px] text-[#8790a2]">
                              TX · {evt.transactionId}
                            </p>
                          )}
                        </div>
                      </div>
                      <time className="shrink-0 pl-12 text-xs text-[#8790a2] sm:pl-0">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[#edf0f5] bg-[#fcfcfe] px-5 py-3 sm:px-6">
              <span className="text-xs text-[#8790a2]">
                Source: gateway telemetry
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#697386]">
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
                {isConnected ? "Stream active" : "Stream offline"}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7047eb]">
                    Protection layer
                  </p>
                  <h3 className="mt-2 text-lg font-bold tracking-tight">
                    Zero-trust gateway
                  </h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#e9e2ff] bg-[#faf8ff] p-4">
                <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`} />
                <div>
                  <p className="text-sm font-semibold">
                    {isConnected ? "Telemetry connected" : "Connection pending"}
                  </p>
                  <p className="mt-1 text-xs text-[#697386]">
                    {isConnected
                      ? "Receiving gateway status"
                      : "Check the gateway server"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <FeatureRow icon={<LockKeyhole />} label="Capability verification" />
                <FeatureRow icon={<ShieldAlert />} label="Policy guardrails" />
                <FeatureRow icon={<RotateCcw />} label="Saga compensation" />
              </div>
              <p className="mt-4 text-[11px] leading-5 text-[#8790a2]">
                Protection features are backed by SQLite nonces, regex/Bedrock guardrails, and reverse compensation handlers.
              </p>
            </div>

            <div className="rounded-2xl bg-[#201448] p-5 text-white shadow-lg shadow-violet-100 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
                  Security insight
                </span>
                <Zap className="h-5 w-5 text-violet-300" />
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight">
                Every tool call matters.
              </p>
              <p className="mt-2 text-sm leading-6 text-violet-200/80">
                Inspect decisions, track transactions, and test capability
                authorization from one workspace.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-violet-200">
                <CircleCheck className="h-4 w-4" />
                Built for observable AI security
                <ArrowUpRight className="ml-auto h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-sm">
          <div className="border-b border-[#edf0f5] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold tracking-tight">Capability token studio</h3>
                <p className="mt-1 text-xs text-[#8790a2]">
                  Generate signed tokens for authorized test requests
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <TokenGenerator />
          </div>
        </section>

        <AttackLab onScenarioComplete={refreshBackendRecords} />

        <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                Persisted Security Ledger
              </h3>
              <p className="text-xs text-[#8790a2]">
                Actual backend database records ({auditHistory.length} audit entries, {transactions.length} transactions).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {accounts.map((acc) => (
                <div
                  key={acc.account_id}
                  className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-3 py-1.5 text-xs"
                >
                  <span className="font-mono font-semibold text-[#697386]">
                    {acc.account_id}:
                  </span>{" "}
                  <span className="font-bold text-[#172033]">
                    ${Number(acc.balance).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#697386]">
                Recent Audit Decisions
              </h4>
              <div className="max-h-56 space-y-2 overflow-auto">
                {auditHistory.length === 0 ? (
                  <p className="text-xs text-[#8790a2]">
                    No persisted audit events yet. Run an Attack Lab scenario above.
                  </p>
                ) : (
                  auditHistory.slice(0, 10).map((row) => (
                    <div
                      key={row.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-[#edf0f5] bg-white p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#7047eb]">
                            {row.tool_name || row.event_type}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              row.verdict === "ALLOWED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {row.verdict}
                          </span>
                        </div>
                        {row.reason && (
                          <p className="mt-1 truncate text-[11px] text-[#697386]">
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

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#697386]">
                Recent Saga Transactions
              </h4>
              <div className="max-h-56 space-y-2 overflow-auto">
                {transactions.length === 0 ? (
                  <p className="text-xs text-[#8790a2]">
                    No persisted transactions yet.
                  </p>
                ) : (
                  transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#edf0f5] bg-white p-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono font-semibold text-[#172033]">
                          {tx.id}
                        </p>
                        <p className="text-[11px] text-[#697386]">
                          Initiator: {tx.initiator || tx.client_id || "system"}
                        </p>
                      </div>
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
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight">Risk Intelligence Matrix</h3>
            <p className="text-xs text-[#8790a2]">
              Real-time risk scoring and behavior assessment for agent tool calls.
            </p>
          </div>
          <RiskIntelligence />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight">Forensics Incident Timeline</h3>
            <p className="text-xs text-[#8790a2]">
              Chronological reconstruction of transactions, tool calls, and rollbacks.
            </p>
          </div>
          <ForensicsTimeline />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold tracking-tight">Security Analytics & Metrics</h3>
            <p className="text-xs text-[#8790a2]">
              Aggregated telemetry insights, threat blocks, and protocol performance.
            </p>
          </div>
          <SecurityAnalytics />
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-[#e7e9f0] pt-5 text-xs text-[#8790a2] sm:flex-row">
          <span>SentinelMCP · Security command center</span>
          <span>Real-time monitoring for Model Context Protocol agents</span>
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  accent: "violet" | "green" | "rose" | "amber";
}) {
  const styles = {
    violet: "bg-[#f0ebff] text-[#7047eb]",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="group rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#d9d0ff] hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[#697386]">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[accent]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#8790a2]">{detail}</p>
    </div>
  );
}

function FeatureRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#465066]">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f6fa] text-[#7047eb]">
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      <CircleCheck className="ml-auto h-4 w-4 text-emerald-500" />
    </div>
  );
}
