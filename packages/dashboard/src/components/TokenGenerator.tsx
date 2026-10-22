"use client";

import { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";

export function TokenGenerator() {
  const [action, setAction] = useState("execute_transfer");
  const [scope, setScope] = useState("accounts:ACC_1001:*");
  const [amount, setAmount] = useState(500);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateToken = () => {
    try {
      const claims = {
        action,
        scope,
        nonce: crypto.randomUUID(),
        expiresAt: Math.floor(Date.now() / 1000) + 300,
        maxAmount: amount,
      };

      const payloadBase64 = btoa(JSON.stringify(claims))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      setToken(`${payloadBase64}.GENERATED_FOR_LOCAL_DEV`);
    } catch (e) {
      console.error(e);
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="w-5 h-5 text-indigo-400" />
        <h3 className="font-semibold text-lg">Capability Token Studio</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">ACTION</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="execute_transfer">execute_transfer</option>
            <option value="delete_record">delete_record</option>
            <option value="send_email">send_email</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">SCOPE</label>
          <input
            type="text"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">MAX AMOUNT ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        onClick={generateToken}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        Issue Token
      </button>

      {token && (
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
          <code className="text-xs font-mono text-emerald-400 break-all">{token}</code>
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}