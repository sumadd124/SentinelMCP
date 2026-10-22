"use client";

import { Clock, ShieldCheck, ShieldAlert, RotateCcw } from "lucide-react";

export function ForensicsTimeline() {
  const events = [
    {
      time: "14:32:01",
      type: "TRANSACTION_INITIATED",
      details: "Saga transaction tx_2393cf41 started for multi-step agent plan.",
      status: "SUCCESS",
    },
    {
      time: "14:32:02",
      type: "TOOL_CALL_ALLOWED",
      details: "Read invoice retrieved successfully under capability scope invoices:*.",
      status: "SUCCESS",
    },
    {
      time: "14:32:03",
      type: "NONCE_VERIFIED",
      details: "Single-use nonce checked and committed to SQLite ledger securely.",
      status: "SUCCESS",
    },
    {
      time: "14:32:04",
      type: "SAGA_ROLLBACK_INITIATED",
      details: "Downstream failure encountered at step 3. Reverse compensation triggered.",
      status: "ROLLED_BACK",
    },
    {
      time: "14:32:05",
      type: "COMPENSATION_COMPLETE",
      details: "Compensating transaction successfully reversed previous ledger state.",
      status: "SUCCESS",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative border-l-2 border-[#e7e9f0] pl-4 space-y-6 ml-2">
        {events.map((evt, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#7047eb]" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="font-bold text-sm text-[#172033]">{evt.type}</span>
              <span className="font-mono text-xs text-[#8790a2]">{evt.time}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#697386]">{evt.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}