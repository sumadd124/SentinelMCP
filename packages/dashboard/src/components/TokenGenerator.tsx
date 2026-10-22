"use client";

import { useState } from "react";
import { KeyRound, Copy, Check, LoaderCircle, AlertCircle } from "lucide-react";
import { getGatewayBaseUrl } from "../hooks/useTelemetry";

export function TokenGenerator() {
  const [action, setAction] = useState("execute_transfer");
  const [scope, setScope] = useState("accounts:ACC_1001:*");
  const [amount, setAmount] = useState(500);
  const [ttl, setTtl] = useState(300);
  const [token, setToken] = useState<string | null>(null);
  const [claimsInfo, setClaimsInfo] = useState<{
    nonce: string;
    expiresAt: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getGatewayBaseUrl()}/api/tokens/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          scope,
          maxAmount: amount,
          expiresInSeconds: ttl,
        }),
      });

      if (!res.ok) {
        throw new Error(`Gateway returned ${res.status}`);
      }

      const data = await res.json();
      setToken(data.token);
      setClaimsInfo(data.claims);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Failed to reach gateway: ${e.message}`
          : "Failed to issue token from gateway"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-5 text-[#172033]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[#7047eb]" />
          <h4 className="text-sm font-bold tracking-tight">
            Cryptographic HMAC-SHA256 Token Issuer
          </h4>
        </div>
        <span className="rounded-md bg-[#f0ebff] px-2.5 py-1 text-[11px] font-semibold text-[#7047eb]">
          Backend-Signed
        </span>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block font-mono text-[11px] font-semibold text-[#697386]">
            TARGET ACTION
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-[#e7e9f0] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#7047eb] focus:outline-none"
          >
            <option value="execute_transfer">execute_transfer</option>
            <option value="delete_record">delete_record</option>
            <option value="send_email">send_email</option>
            <option value="read_invoice">read_invoice</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] font-semibold text-[#697386]">
            RESOURCE SCOPE
          </label>
          <input
            type="text"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full rounded-lg border border-[#e7e9f0] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#7047eb] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] font-semibold text-[#697386]">
            MAX AMOUNT ($)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-[#e7e9f0] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#7047eb] focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] font-semibold text-[#697386]">
            TTL (SECONDS)
          </label>
          <input
            type="number"
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            className="w-full rounded-lg border border-[#e7e9f0] bg-white px-3 py-2 text-sm text-[#172033] focus:border-[#7047eb] focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={generateToken}
        disabled={loading}
        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#7047eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5d36d6] disabled:opacity-60"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Issue Signed Capability Token
      </button>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {token && (
        <div className="mt-4 space-y-2 rounded-xl border border-[#e7e9f0] bg-white p-3.5">
          <div className="flex items-center justify-between gap-2">
            <code className="break-all font-mono text-xs text-emerald-700">
              {token}
            </code>
            <button
              onClick={copyToClipboard}
              className="cursor-pointer rounded-lg border border-[#e7e9f0] p-2 text-[#697386] transition hover:bg-[#f5f6fa] hover:text-[#172033]"
              title="Copy token"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {claimsInfo && (
            <div className="flex flex-wrap gap-4 border-t border-[#f0f1f6] pt-2 text-[11px] text-[#697386]">
              <span>
                <strong>Nonce:</strong>{" "}
                <code className="font-mono text-[#172033]">{claimsInfo.nonce}</code>
              </span>
              <span>
                <strong>Expires:</strong>{" "}
                {new Date(claimsInfo.expiresAt * 1000).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
