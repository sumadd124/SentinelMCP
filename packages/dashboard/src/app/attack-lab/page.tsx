"use client";

import React, { useState } from "react";
import { AttackLab } from "../../components/AttackLab";
import { getGatewayBaseUrl, useTelemetry } from "../../hooks/useTelemetry";
import {
  Terminal,
  Play,
  LoaderCircle,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

type ToolOption =
  | "read_invoice"
  | "check_balance"
  | "create_user_record"
  | "send_email"
  | "execute_transfer"
  | "delete_record";

const PRESET_PAYLOADS: Record<ToolOption, string> = {
  read_invoice: JSON.stringify({ invoice_id: "INV-2026-104" }, null, 2),
  check_balance: JSON.stringify({ account_id: "ACC_1001" }, null, 2),
  create_user_record: JSON.stringify(
    {
      record_id: "REC-SIM-101",
      content: "Standard verified operational audit note.",
    },
    null,
    2
  ),
  send_email: JSON.stringify(
    {
      to: "security-ops@enterprise.internal",
      subject: "Simulation Verification",
      body: "Gateway simulation check completed.",
    },
    null,
    2
  ),
  execute_transfer: JSON.stringify(
    {
      source_account: "ACC_1001",
      destination_account: "ACC_2002",
      amount: 50,
      capability_token: "<paste-token-from-capability-token-studio>",
    },
    null,
    2
  ),
  delete_record: JSON.stringify(
    {
      record_id: "REC-SIM-101",
      capability_token: "<paste-token-from-capability-token-studio>",
    },
    null,
    2
  ),
};

interface SimulationResponse {
  authorized: boolean;
  verdict: "ALLOWED" | "BLOCKED";
  reason: string;
  transactionId: string;
  result?: Record<string, unknown>;
}

export default function AttackLabPage() {
  const { refreshBackendRecords } = useTelemetry();

  const [selectedTool, setSelectedTool] = useState<ToolOption>("read_invoice");
  const [payloadText, setPayloadText] = useState<string>(
    PRESET_PAYLOADS.read_invoice
  );
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  const handleSelectTool = (tool: ToolOption) => {
    setSelectedTool(tool);
    setPayloadText(PRESET_PAYLOADS[tool]);
    setSimError(null);
  };

  const runCustomSimulation = async () => {
    setSimError(null);
    let parsedArgs: Record<string, unknown>;
    try {
      parsedArgs = JSON.parse(payloadText);
    } catch {
      setSimError("Invalid JSON parameters payload.");
      return;
    }

    setSimLoading(true);
    try {
      const res = await fetch(`${getGatewayBaseUrl()}/api/tools/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: selectedTool,
          args: parsedArgs,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gateway returned ${res.status}: ${text}`);
      }

      const data: SimulationResponse = await res.json();
      setSimResult(data);
      await refreshBackendRecords();
    } catch (err) {
      setSimError(
        err instanceof Error
          ? `Simulation execution failed: ${err.message}`
          : "Simulation request failed"
      );
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
          Access & Testing
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
          Attack Lab & Simulations
        </h1>
        <p className="mt-1 text-sm text-[#697386]">
          Execute controlled exploit scenarios and interactive MCP tool
          simulations against the SentinelMCP Gateway.
        </p>
      </div>

      {/* Controlled Adversarial Scenarios (Existing AttackLab Component) */}
      <AttackLab onScenarioComplete={refreshBackendRecords} />

      {/* Interactive Custom Tool Simulation Runner */}
      <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-xs">
        <div className="border-b border-[#edf0f5] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#172033]">
                Interactive Tool Simulation Runner
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Dispatch custom MCP tool invocations to POST /api/tools/execute
                to test guardrail patterns and capability tokens
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2 sm:p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="sim-tool-select"
                className="mb-1.5 block font-mono text-[11px] font-semibold uppercase text-[#697386]"
              >
                Select Registered MCP Tool
              </label>
              <select
                id="sim-tool-select"
                value={selectedTool}
                onChange={(e) => handleSelectTool(e.target.value as ToolOption)}
                className="w-full rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-3.5 py-2.5 text-sm font-medium text-[#172033] focus:border-[#7047eb] focus:bg-white focus:outline-none"
              >
                <option value="read_invoice">
                  read_invoice (Read-only · No token required)
                </option>
                <option value="check_balance">
                  check_balance (Read-only · No token required)
                </option>
                <option value="create_user_record">
                  create_user_record (Content guardrail inspected)
                </option>
                <option value="send_email">
                  send_email (Subject & body guardrail inspected)
                </option>
                <option value="execute_transfer">
                  execute_transfer (Requires HMAC capability_token)
                </option>
                <option value="delete_record">
                  delete_record (Requires HMAC capability_token)
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sim-payload-textarea"
                className="mb-1.5 block font-mono text-[11px] font-semibold uppercase text-[#697386]"
              >
                Tool Arguments Payload (JSON)
              </label>
              <textarea
                id="sim-payload-textarea"
                rows={6}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5 font-mono text-xs text-[#172033] focus:border-[#7047eb] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={runCustomSimulation}
              disabled={simLoading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#7047eb] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#5d36d6] disabled:opacity-60"
            >
              {simLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Execute Tool Simulation
            </button>

            {simError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{simError}</span>
              </div>
            )}
          </div>

          {/* Simulation Output Panel */}
          <div className="flex flex-col justify-between rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-5">
            {!simResult ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <Terminal className="mb-2 h-7 w-7 text-[#8790a2]" />
                <p className="text-sm font-semibold text-[#172033]">
                  Ready to Execute Simulation
                </p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-[#697386]">
                  Choose a tool, customize the JSON arguments, and execute to
                  inspect the gateway policy verdict and transaction record.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#edf0f5] pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#697386]">
                    Gateway Simulation Verdict
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-bold ${
                      simResult.verdict === "ALLOWED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {simResult.verdict === "ALLOWED" ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    )}
                    {simResult.verdict}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase text-[#8790a2]">
                    Decision Reason
                  </span>
                  <p className="mt-1 font-mono text-xs text-[#172033]">
                    {simResult.reason}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase text-[#8790a2]">
                    Transaction ID
                  </span>
                  <p className="mt-1 font-mono text-xs text-[#7047eb]">
                    {simResult.transactionId}
                  </p>
                </div>

                {simResult.result && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase text-[#8790a2]">
                      Handler Return Output
                    </span>
                    <pre className="mt-1.5 overflow-x-auto rounded-lg border border-[#e7e9f0] bg-white p-3 font-mono text-[11px] text-[#172033]">
                      {JSON.stringify(simResult.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
