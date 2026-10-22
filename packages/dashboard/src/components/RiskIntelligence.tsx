"use client";

import { ShieldAlert, AlertTriangle, CheckCircle, Flame } from "lucide-react";

export function RiskIntelligence() {
  const riskRules = [
    {
      tool: "execute_transfer",
      level: "CRITICAL",
      score: "92/100",
      description: "Financial execution tool requiring strict capability validation and double-nonce verification.",
      color: "bg-rose-50 text-rose-600 border-rose-200",
    },
    {
      tool: "delete_record",
      level: "HIGH",
      score: "78/100",
      description: "Destructive database operation. Protected by saga rollback and zero-trust policy guardrails.",
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      tool: "create_user_record",
      level: "MEDIUM",
      score: "45/100",
      description: "Content injection detection active via local regex and AWS Bedrock fallback guardrails.",
      color: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      tool: "read_invoice / check_balance",
      level: "LOW",
      score: "12/100",
      description: "Read-only telemetry and lookup operations with minimal security risk surface.",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {riskRules.map((rule, idx) => (
          <div key={idx} className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#7047eb]">{rule.tool}</span>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${rule.color}`}>
                {rule.level} · {rule.score}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#697386]">{rule.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}