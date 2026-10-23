"use client";

import React from "react";
import { RiskIntelligence } from "../../components/RiskIntelligence";
import { useTelemetry } from "../../hooks/useTelemetry";
import {
  ShieldAlert,
  LockKeyhole,
  RotateCcw,
  FileWarning,
  CheckCircle2,
} from "lucide-react";

const GUARDRAIL_PATTERNS = [
  {
    pattern: "/drop\\s+table/i",
    category: "Destructive SQL Injection",
    severity: "CRITICAL",
    targetTools: "create_user_record, send_email",
  },
  {
    pattern: "/ignore\\s+previous\\s+instructions/i",
    category: "Direct Prompt Injection Override",
    severity: "CRITICAL",
    targetTools: "create_user_record, send_email",
  },
  {
    pattern: "/<script.*?>/i",
    category: "Cross-Site Scripting / Payload Exfiltration",
    severity: "HIGH",
    targetTools: "create_user_record, send_email",
  },
  {
    pattern: "/delete\\s+all\\s+records/i",
    category: "Unauthorized Bulk Destruction Intent",
    severity: "HIGH",
    targetTools: "create_user_record, send_email",
  },
  {
    pattern: "/system\\s+override/i",
    category: "Privilege Escalation Command",
    severity: "HIGH",
    targetTools: "create_user_record, send_email",
  },
  {
    pattern: "/exploit/i",
    category: "Adversarial Exploit Marker",
    severity: "MEDIUM",
    targetTools: "create_user_record, send_email",
  },
];

export default function RiskIntelligencePage() {
  const { auditHistory } = useTelemetry();

  const blockedEvents = auditHistory.filter((e) => e.verdict === "BLOCKED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
          Investigate
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
          Risk Intelligence Matrix
        </h1>
        <p className="mt-1 text-sm text-[#697386]">
          Tool risk prioritization, threat severity scoring, active guardrail
          signatures, and risk mitigation relationships.
        </p>
      </div>

      {/* Tool Risk Classification Matrix (Existing RiskIntelligence Component) */}
      <section className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              MCP Tool Risk Classification & Severity Scores
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Baseline risk assessment and required security controls per
              registered tool
            </p>
          </div>
          <ShieldAlert className="h-5 w-5 text-[#7047eb]" />
        </div>
        <RiskIntelligence />
      </section>

      {/* Guardrail Threat Signatures & Risk Control Relationships */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Active Content Guardrail Signatures
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Deterministic inspection rules evaluated by
                LocalDemoGuardrailProvider prior to tool execution
              </p>
            </div>
            <FileWarning className="h-5 w-5 text-rose-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#edf0f5] text-[11px] font-bold uppercase text-[#8790a2]">
                  <th className="pb-2.5 pr-3">Detection Pattern</th>
                  <th className="pb-2.5 pr-3">Threat Vector</th>
                  <th className="pb-2.5 pr-3">Severity</th>
                  <th className="pb-2.5">Inspected Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f1f6]">
                {GUARDRAIL_PATTERNS.map((rule) => (
                  <tr key={rule.pattern}>
                    <td className="py-2.5 pr-3 font-mono text-[11px] font-bold text-[#7047eb]">
                      {rule.pattern}
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-[#172033]">
                      {rule.category}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          rule.severity === "CRITICAL"
                            ? "bg-rose-50 text-rose-700"
                            : rule.severity === "HIGH"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-[11px] text-[#697386]">
                      {rule.targetTools}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Defense-in-Depth Control Relationships */}
        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              Risk-to-Control Relationships
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              How SentinelMCP maps threat severity to cryptographic and
              transactional defenses
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                <LockKeyhole className="h-4 w-4 text-[#7047eb]" />
                Critical Financial Risk → HMAC + Single-Use Nonce
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#697386]">
                <code className="font-mono text-[#7047eb]">
                  execute_transfer
                </code>{" "}
                enforces constant-time HMAC-SHA256 verification, action match,
                amount ceiling checks, and atomic nonce persistence in SQLite.
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                <RotateCcw className="h-4 w-4 text-amber-600" />
                High Destructive Risk → Snapshot & Saga Compensation
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#697386]">
                <code className="font-mono text-[#7047eb]">delete_record</code>{" "}
                captures the prior record snapshot before removal so reverse
                Saga rollbacks can restore deleted data if a multi-step plan
                fails.
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Recent Threat Interceptions ({blockedEvents.length})
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#697386]">
                {blockedEvents.length === 0
                  ? "No blocked tool attempts recorded yet in SQLite audit_events."
                  : `Latest intercepted threat on '${
                      blockedEvents[0].tool_name || blockedEvents[0].event_type
                    }': ${blockedEvents[0].reason}`}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
