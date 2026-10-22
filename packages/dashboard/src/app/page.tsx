"use client";

import { useTelemetry } from "../hooks/useTelemetry";
import { TokenGenerator } from "../components/TokenGenerator";
import type { TelemetryEvent } from "../types/telemetry";
import { Shield, ShieldAlert, ShieldCheck, Activity, Trash2, Radio } from "lucide-react";

export default function DashboardPage() {
  const { events, isConnected, clearEvents } = useTelemetry();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-500" />
              <h1 className="text-2xl font-bold tracking-tight">SentinelMCP Monitor</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Real-time MCP tool inspection, zero-trust guardrails, and saga ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900 text-xs">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-400 animate-pulse" : "text-rose-500"}`} />
              <span className="font-mono text-slate-300">
                {isConnected ? "GATEWAY CONNECTED (SSE)" : "GATEWAY DISCONNECTED"}
              </span>
            </div>

            <button
              onClick={clearEvents}
              className="p-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Clear event history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Studio Utilities */}
        <TokenGenerator />

        {/* Live Event Stream */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-sm tracking-wide uppercase text-slate-300">
                Live Transaction & Guardrail Stream
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">{events.length} events logged</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto font-mono text-xs">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-sans">
                No telemetry events intercepted yet. Invoke an MCP tool through Claude or an integration test to observe traffic.
              </div>
            ) : (
              events.map((evt, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start md:items-center gap-3">
                    {evt.verdict === "BLOCKED" || evt.type === "SAGA_ROLLBACK_INITIATED" ? (
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 md:mt-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 md:mt-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-200">{evt.type}</span>
                        {evt.toolName && (
                          <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded text-[11px]">
                            {evt.toolName}
                          </span>
                        )}
                        {evt.verdict && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.verdict === "ALLOWED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}>
                            {evt.verdict}
                          </span>
                        )}
                      </div>

                      {evt.reason && (
                        <p className="text-rose-400 mt-1 font-sans text-xs">{evt.reason}</p>
                      )}
                      {evt.transactionId && (
                        <p className="text-slate-500 text-[10px] mt-0.5">TX: {evt.transactionId}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-slate-500 text-[11px] shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </main>
  );
}