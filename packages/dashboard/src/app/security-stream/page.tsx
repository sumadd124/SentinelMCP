"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTelemetry } from "../../hooks/useTelemetry";
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  LockKeyhole,
  RotateCcw,
  Radio,
  Trash2,
  CircleCheck,
  Search,
  FlaskConical,
  KeyRound,
} from "lucide-react";

type StreamFilter = "ALL" | "ALLOWED" | "BLOCKED" | "ROLLBACK";

export default function SecurityStreamPage() {
  const { events, isConnected, clearEvents } = useTelemetry();
  const [filter, setFilter] = useState<StreamFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const allowed = events.filter((e) => e.verdict === "ALLOWED").length;
  const blocked = events.filter(
    (e) => e.verdict === "BLOCKED" || e.type === "SAGA_ROLLBACK_INITIATED"
  ).length;
  const rollbacks = events.filter(
    (e) =>
      e.type === "SAGA_ROLLBACK_INITIATED" ||
      e.type === "ROLLBACK_COMPLETED" ||
      e.type === "COMPENSATION_EXECUTED"
  ).length;

  const filteredEvents = events.filter((evt) => {
    if (filter === "ALLOWED" && evt.verdict !== "ALLOWED") return false;
    if (
      filter === "BLOCKED" &&
      evt.verdict !== "BLOCKED" &&
      evt.type !== "SAGA_ROLLBACK_INITIATED"
    ) {
      return false;
    }
    if (
      filter === "ROLLBACK" &&
      evt.type !== "SAGA_ROLLBACK_INITIATED" &&
      evt.type !== "ROLLBACK_COMPLETED" &&
      evt.type !== "COMPENSATION_EXECUTED" &&
      evt.type !== "COMPENSATION_FAILED"
    ) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = evt.type.toLowerCase().includes(q);
      const matchTool = evt.toolName?.toLowerCase().includes(q) ?? false;
      const matchReason = evt.reason?.toLowerCase().includes(q) ?? false;
      const matchTx = evt.transactionId?.toLowerCase().includes(q) ?? false;
      return matchType || matchTool || matchReason || matchTx;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
            Monitor
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
            Security Stream
          </h1>
          <p className="mt-1 text-sm text-[#697386]">
            Live gateway telemetry, policy verdicts, threat blocks, and real-time
            MCP transaction events over SSE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/attack-lab"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#172033] shadow-2xs transition hover:border-[#d3c7ff]"
          >
            <FlaskConical className="h-4 w-4 text-[#7047eb]" />
            Run Simulation
          </Link>

          <button
            type="button"
            onClick={clearEvents}
            title="Clear session event stream"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e7e9f0] bg-white px-3.5 py-2 text-xs font-semibold text-[#697386] shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
            Clear Stream
          </button>
        </div>
      </div>

      {/* Session KPI Strip */}
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
          detail="Rollback & compensation events"
          icon={<RotateCcw className="h-5 w-5" />}
          accent="amber"
        />
      </section>

      {/* Main Stream & Protection Status Grid */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-xs xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 border-b border-[#edf0f5] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold tracking-tight text-[#172033]">
                  Live Security Event Feed
                </h2>
                <p className="mt-0.5 text-xs text-[#8790a2]">
                  Real-time gateway decisions and transaction events
                </p>
              </div>
            </div>
            <span className="w-fit rounded-lg bg-[#f5f6fa] px-3 py-1.5 font-mono text-xs font-semibold text-[#697386]">
              {filteredEvents.length} / {events.length} events
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col justify-between gap-3 border-b border-[#edf0f5] bg-[#fcfcfe] px-5 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "ALL", label: "All Events" },
                  { id: "ALLOWED", label: "Allowed" },
                  { id: "BLOCKED", label: "Blocked" },
                  { id: "ROLLBACK", label: "Rollbacks" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    filter === tab.id
                      ? "bg-[#7047eb] text-white"
                      : "bg-white text-[#697386] border border-[#e7e9f0] hover:text-[#172033]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[#8790a2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by tool, TX ID, reason..."
                aria-label="Filter security stream events"
                className="w-full rounded-lg border border-[#e7e9f0] bg-white py-1.5 pl-8 pr-3 text-xs text-[#172033] placeholder:text-[#8790a2] focus:border-[#7047eb] focus:outline-none"
              />
            </div>
          </div>

          {/* Event List */}
          <div className="max-h-[540px] overflow-auto">
            {filteredEvents.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ebff] text-[#7047eb]">
                  <Activity className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-[#172033]">
                  {events.length === 0
                    ? "Waiting for gateway activity"
                    : "No events match current filter"}
                </h3>
                <p className="mt-2 max-w-sm text-xs leading-5 text-[#8790a2]">
                  {events.length === 0
                    ? "Invoke an MCP tool, issue a capability token, or run a simulation in Attack Lab to stream live security decisions here."
                    : "Try clearing the search query or switching the event filter tab above."}
                </p>
                {events.length === 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/attack-lab"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#7047eb] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5d36d6]"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Launch Attack Lab
                    </Link>
                    <Link
                      href="/capability-tokens"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e7e9f0] bg-white px-3 py-1.5 text-xs font-semibold text-[#172033] transition hover:border-[#d3c7ff]"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-[#7047eb]" />
                      Issue Test Token
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#f0f1f6]">
                {filteredEvents.map((evt, idx) => (
                  <div
                    key={`${evt.timestamp}-${idx}`}
                    className="flex flex-col justify-between gap-3 px-5 py-4 transition hover:bg-[#fafaff] sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          evt.verdict === "BLOCKED" ||
                          evt.type === "SAGA_ROLLBACK_INITIATED" ||
                          evt.type === "COMPENSATION_FAILED"
                            ? "bg-rose-50 text-rose-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {evt.verdict === "BLOCKED" ||
                        evt.type === "SAGA_ROLLBACK_INITIATED" ||
                        evt.type === "COMPENSATION_FAILED" ? (
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
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${
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
                          <p className="mt-1 font-mono text-xs font-semibold text-[#7047eb]">
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
                    <time className="shrink-0 pl-12 font-mono text-xs text-[#8790a2] sm:pl-0">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#edf0f5] bg-[#fcfcfe] px-5 py-3 sm:px-6">
            <span className="text-xs text-[#8790a2]">
              Source: Gateway SSE telemetry (/sse)
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#697386]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {isConnected ? "Stream active" : "Stream offline"}
            </span>
          </div>
        </div>

        {/* Protection Layer Status Column */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7047eb]">
                  Protection Layer
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-[#172033]">
                  Zero-Trust Gateway
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#e9e2ff] bg-[#faf8ff] p-4">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-[#172033]">
                  {isConnected ? "Telemetry connected" : "Connection pending"}
                </p>
                <p className="mt-0.5 text-xs text-[#697386]">
                  {isConnected
                    ? "Receiving live gateway events"
                    : "Start the gateway server on port 3001"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <FeatureRow
                icon={<LockKeyhole className="h-4 w-4" />}
                label="HMAC-SHA256 capability verification"
              />
              <FeatureRow
                icon={<ShieldAlert className="h-4 w-4" />}
                label="Dual-tier policy guardrails"
              />
              <FeatureRow
                icon={<RotateCcw className="h-4 w-4" />}
                label="Automated Saga rollback engine"
              />
            </div>

            <p className="mt-4 text-[11px] leading-5 text-[#8790a2]">
              Protection features are backed by SQLite single-use nonces,
              deterministic regex / AWS Bedrock guardrails, and reverse
              compensation handlers.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-sm font-bold text-[#172033]">
              Streamed Event Types
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#697386]">
              Events emitted by the gateway broadcaster during tool evaluation:
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                "SYSTEM_CONNECT",
                "TOKEN_ISSUED",
                "TRANSACTION_INITIATED",
                "TOOL_REQUEST",
                "TOOL_VERDICT",
                "TRANSACTION_COMMITTED",
                "SAGA_ROLLBACK_INITIATED",
                "COMPENSATION_EXECUTED",
                "ROLLBACK_COMPLETED",
              ].map((type) => (
                <span
                  key={type}
                  className="rounded-md border border-[#e7e9f0] bg-[#fcfcfe] px-2 py-1 font-mono text-[10px] font-semibold text-[#465066]"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
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
    <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[#697386]">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[accent]}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-[#172033]">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-[#8790a2]">{detail}</p>
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
    <div className="flex items-center gap-3 text-xs font-medium text-[#465066]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f6fa] text-[#7047eb]">
        {icon}
      </span>
      <span>{label}</span>
      <CircleCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
    </div>
  );
}
