"use client";

import { BarChart3, ShieldCheck, ShieldAlert, LockKeyhole, RotateCcw } from "lucide-react";

export function SecurityAnalytics() {
  const metrics = [
    { label: "Total Security Evaluations", value: "1,248", change: "+14% today", icon: <BarChart3 className="h-5 w-5 text-[#7047eb]" />, bg: "bg-[#f0ebff]" },
    { label: "Zero-Trust Allowed", value: "1,112", change: "91.5% success rate", icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-50" },
    { label: "Threats Blocked / Guardrailed", value: "136", change: "Prompt injection & policy denied", icon: <ShieldAlert className="h-5 w-5 text-rose-600" />, bg: "bg-rose-50" },
    { label: "Replay Attacks Prevented", value: "42", change: "SQLite nonce match", icon: <LockKeyhole className="h-5 w-5 text-amber-600" />, bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m, idx) => (
        <div key={idx} className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-5">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-[#697386]">{m.label}</span>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}>
              {m.icon}
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-[#172033]">{m.value}</p>
          <p className="mt-1 text-xs text-[#8790a2]">{m.change}</p>
        </div>
      ))}
    </div>
  );
}