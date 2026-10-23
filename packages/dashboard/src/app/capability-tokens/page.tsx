"use client";

import React, { useState } from "react";
import { TokenGenerator } from "../../components/TokenGenerator";
import {
  LockKeyhole,
  KeyRound,
  SearchCode,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";

interface DecodedToken {
  rawPayload: string;
  signature: string;
  claims: {
    action?: string;
    scope?: string;
    nonce?: string;
    expiresAt?: number;
    maxAmount?: number;
    [key: string]: unknown;
  };
  isExpired: boolean;
}

const TOOL_POLICIES = [
  {
    tool: "execute_transfer",
    requiresToken: true,
    maxAmount: "$10,000.00 ceiling + token maxAmount",
    inspectedFields: "None (numeric/account schema)",
    compensation: "Reverses debit/credit on mock_accounts",
  },
  {
    tool: "delete_record",
    requiresToken: true,
    maxAmount: "N/A",
    inspectedFields: "None",
    compensation: "Restores deleted record content to SQLite",
  },
  {
    tool: "create_user_record",
    requiresToken: false,
    maxAmount: "N/A",
    inspectedFields: "content",
    compensation: "Deletes created record from SQLite",
  },
  {
    tool: "send_email",
    requiresToken: false,
    maxAmount: "N/A",
    inspectedFields: "subject, body",
    compensation: "Marks outbox draft as cancelled",
  },
  {
    tool: "read_invoice",
    requiresToken: false,
    maxAmount: "N/A",
    inspectedFields: "None",
    compensation: "Read-only (no-op compensation)",
  },
  {
    tool: "check_balance",
    requiresToken: false,
    maxAmount: "N/A",
    inspectedFields: "None",
    compensation: "Read-only (no-op compensation)",
  },
];

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  return atob(padded);
}

export default function CapabilityTokensPage() {
  const [inspectInput, setInspectInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const handleInspect = (raw: string) => {
    setInspectInput(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      setDecoded(null);
      setDecodeError(null);
      return;
    }

    const parts = trimmed.split(".");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setDecoded(null);
      setDecodeError(
        "Malformed capability token: expected `<base64url-claims>.<hmac-sha256-signature>` format."
      );
      return;
    }

    try {
      const jsonStr = decodeBase64Url(parts[0]);
      const claims = JSON.parse(jsonStr);
      const nowSec = Math.floor(Date.now() / 1000);
      const isExpired =
        typeof claims.expiresAt === "number"
          ? claims.expiresAt <= nowSec
          : false;

      setDecoded({
        rawPayload: parts[0],
        signature: parts[1],
        claims,
        isExpired,
      });
      setDecodeError(null);
    } catch {
      setDecoded(null);
      setDecodeError("Unable to decode Base64URL JSON claims payload.");
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
          Capability Token Studio
        </h1>
        <p className="mt-1 text-sm text-[#697386]">
          Issue backend-signed HMAC-SHA256 capability tokens, inspect decoded
          authorization claims, and review zero-trust tool policies.
        </p>
      </div>

      {/* Token Issuer (Existing TokenGenerator Component) */}
      <section className="overflow-hidden rounded-2xl border border-[#e7e9f0] bg-white shadow-xs">
        <div className="border-b border-[#edf0f5] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight text-[#172033]">
                Issue Signed Capability Token
              </h2>
              <p className="mt-0.5 text-xs text-[#8790a2]">
                Generate real HMAC-SHA256 capability tokens via POST
                /api/tokens/issue for authorized test requests
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <TokenGenerator />
        </div>
      </section>

      {/* Token Claims & Structure Inspector */}
      <section className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
            <SearchCode className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold tracking-tight text-[#172033]">
              Capability Token Claims Inspector
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Paste any issued token above to decode its Base64URL claims,
              UUIDv4 nonce, action binding, and TTL status
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="token-inspector-input"
            className="mb-1.5 block font-mono text-[11px] font-semibold uppercase text-[#697386]"
          >
            Paste Signed Token (payload.signature)
          </label>
          <input
            id="token-inspector-input"
            type="text"
            value={inspectInput}
            onChange={(e) => handleInspect(e.target.value)}
            placeholder="eyJhY3Rpb24iOiJleGVjdXRlX3RyYW5zZmVyIiwic2NvcGUiOi... . <hmac_signature>"
            className="w-full rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-3.5 py-2.5 font-mono text-xs text-[#172033] placeholder:text-[#8790a2] focus:border-[#7047eb] focus:bg-white focus:outline-none"
          />
        </div>

        {decodeError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{decodeError}</span>
          </div>
        )}

        {decoded && (
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8790a2]">
                Bound Action & Scope
              </span>
              <p className="mt-1 font-mono text-xs font-bold text-[#7047eb]">
                {decoded.claims.action || "N/A"}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-[#465066]">
                {decoded.claims.scope || "N/A"}
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8790a2]">
                Single-Use UUIDv4 Nonce
              </span>
              <p className="mt-1 break-all font-mono text-xs font-semibold text-[#172033]">
                {decoded.claims.nonce || "N/A"}
              </p>
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8790a2]">
                TTL Expiration Window
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#7047eb]" />
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    decoded.isExpired
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {decoded.isExpired ? "EXPIRED" : "ACTIVE TTL"}
                </span>
              </div>
              {typeof decoded.claims.expiresAt === "number" && (
                <p className="mt-1 font-mono text-[11px] text-[#697386]">
                  {new Date(decoded.claims.expiresAt * 1000).toLocaleString()}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8790a2]">
                HMAC-SHA256 Signature
              </span>
              <p className="mt-1 truncate font-mono text-xs font-semibold text-[#172033]">
                {decoded.signature}
              </p>
              <p className="mt-0.5 text-[11px] text-[#697386]">
                Max Amount:{" "}
                {decoded.claims.maxAmount !== undefined
                  ? `$${decoded.claims.maxAmount}`
                  : "Unbounded"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Registered Tool Capability Policy Reference */}
      <section className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              Gateway Tool Capability Enforcement Matrix
            </h2>
            <p className="mt-0.5 text-xs text-[#8790a2]">
              Actual verification rules enforced by PolicyEnforcer and
              CapabilityTokenManager
            </p>
          </div>
          <KeyRound className="h-5 w-5 text-[#7047eb]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#edf0f5] text-[11px] font-bold uppercase text-[#8790a2]">
                <th className="pb-2.5 pr-4">MCP Tool</th>
                <th className="pb-2.5 pr-4">Capability Token</th>
                <th className="pb-2.5 pr-4">Amount Ceiling</th>
                <th className="pb-2.5 pr-4">Guardrail Fields</th>
                <th className="pb-2.5">Saga Compensation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f6]">
              {TOOL_POLICIES.map((row) => (
                <tr key={row.tool}>
                  <td className="py-3 pr-4 font-mono font-bold text-[#7047eb]">
                    {row.tool}
                  </td>
                  <td className="py-3 pr-4">
                    {row.requiresToken ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-[#f0ebff] px-2 py-0.5 text-[10px] font-bold text-[#7047eb]">
                        <LockKeyhole className="h-3 w-3" />
                        REQUIRED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        OPEN / GUARDRAILED
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-[#465066]">{row.maxAmount}</td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-[#465066]">
                    {row.inspectedFields}
                  </td>
                  <td className="py-3 text-[#697386]">{row.compensation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
