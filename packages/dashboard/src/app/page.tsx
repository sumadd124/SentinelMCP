import Link from "next/link";
import {
  Shield,
  Radio,
  LockKeyhole,
  ShieldAlert,
  RotateCcw,
  Clock,
  ArrowRight,
  FlaskConical,
  Database,
  CheckCircle2,
} from "lucide-react";

const CORE_CAPABILITIES = [
  {
    title: "Real-Time MCP Security Monitoring",
    description:
      "Streams live tool requests, pass/block policy verdicts, capability token issuances, and rollback alerts over Server-Sent Events (/sse) as autonomous agents invoke Model Context Protocol tools.",
    href: "/security-stream",
    linkLabel: "Open Security Stream",
    icon: Radio,
  },
  {
    title: "Dual-Tier Threat & Injection Detection",
    description:
      "Inspects untrusted tool input fields (such as record content, email subjects, and message bodies) before execution using deterministic local regex patterns or AWS Bedrock Guardrails in fail-closed mode.",
    href: "/risk-intelligence",
    linkLabel: "View Risk Intelligence",
    icon: ShieldAlert,
  },
  {
    title: "Cryptographic Capability Enforcement",
    description:
      "Protects high-impact tools (execute_transfer, delete_record) with HMAC-SHA256 signed capability tokens bound to specific actions, resource scopes, transfer ceilings, TTL windows, and single-use SQLite UUIDv4 nonces.",
    href: "/capability-tokens",
    linkLabel: "Open Token Studio",
    icon: LockKeyhole,
  },
  {
    title: "Forensic Investigation & Saga Rollbacks",
    description:
      "Tracks multi-step agent executions in a local SQLite ledger and automatically executes reverse-order compensating actions when a downstream tool call fails or violates security policy.",
    href: "/forensics",
    linkLabel: "Inspect Forensics Timeline",
    icon: RotateCcw,
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Intercept & Register Transaction",
    detail:
      "Every incoming MCP tool call is intercepted by the gateway before reaching the underlying tool handler and assigned a tracked transaction identifier (tx_*) in the SQLite ledger.",
  },
  {
    step: "02",
    title: "Evaluate Content Guardrails",
    detail:
      "Target text parameters are scanned for prompt injections, system overrides, destructive SQL commands, and script tags via LocalDemoGuardrailProvider or AWS Bedrock Guardrails.",
  },
  {
    step: "03",
    title: "Verify Capability & Consume Nonce",
    detail:
      "Privileged tools require an HMAC-SHA256 token verified with constant-time signature comparison, action binding, amount limit checks, TTL validation, and atomic nonce persistence.",
  },
  {
    step: "04",
    title: "Commit Step or Trigger Saga Rollback",
    detail:
      "Approved executions record forward outputs to transaction_steps. If a step is blocked or throws an error midway through a plan, registered compensations reverse prior mutations in reverse order.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7047eb] text-white">
            <Shield className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <span className="rounded-full border border-[#e9e2ff] bg-[#f0ebff] px-3 py-1 text-xs font-bold tracking-wide text-[#7047eb]">
            ZERO-TRUST MCP SECURITY GATEWAY
          </span>
        </div>

        <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-[#172033] sm:text-4xl">
          Sentinel<span className="text-[#7047eb]">MCP</span> — Policy
          Enforcement & Transaction Integrity for AI Agents
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#465066] sm:text-base">
          SentinelMCP sits between AI agent runtimes (such as Claude Desktop,
          custom agentic frameworks, and LLM orchestrators) and backend Model
          Context Protocol (MCP) tool servers. It acts as an active policy
          enforcement firewall that prevents unauthorized tool invocations,
          blocks prompt injection payloads before execution, guards sensitive
          operations with single-use cryptographic capability tokens, and
          restores database state on failure through compensating Saga
          rollbacks.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/security-stream"
            className="inline-flex items-center gap-2 rounded-xl bg-[#7047eb] px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#5d36d6]"
          >
            <Radio className="h-4 w-4" />
            Open Security Stream
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/attack-lab"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-5 py-3 text-sm font-semibold text-[#172033] transition hover:border-[#d3c7ff] hover:bg-[#f0ebff]/50"
          >
            <FlaskConical className="h-4 w-4 text-[#7047eb]" />
            Explore Platform in Attack Lab
          </Link>
        </div>
      </section>

      {/* The Problem & Security Workflow */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-[#e7e9f0] bg-[#201448] p-6 text-white sm:p-7 lg:col-span-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
              Why SentinelMCP Exists
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
              The Security Gap in Autonomous Tool Execution
            </h2>
            <p className="mt-3 text-xs leading-6 text-violet-100/90 sm:text-sm">
              Standard MCP connections expose backend tools directly to LLM
              orchestrators. Without an intermediary enforcement boundary,
              autonomous agents face four operational risks:
            </p>

            <ul className="mt-5 space-y-3 text-xs leading-5 text-violet-100">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span>
                  <strong className="text-white">Unverified Intent:</strong>{" "}
                  Agents invoking destructive or financial tools without
                  cryptographic proof of authorization or scope boundaries.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span>
                  <strong className="text-white">Token Replay & Stale Access:</strong>{" "}
                  Intercepted or expired authorization credentials being reused
                  to repeat privileged transfers or deletions.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span>
                  <strong className="text-white">Prompt & Script Injection:</strong>{" "}
                  Adversarial instructions embedded in untrusted inputs reaching
                  downstream databases or email outboxes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span>
                  <strong className="text-white">Partial State Corruption:</strong>{" "}
                  Multi-step agent plans failing at step N after earlier steps
                  have already debited balances or mutated records.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-violet-800/70 pt-4 text-xs text-violet-200">
            SentinelMCP enforces deterministic checks on every tool call before
            and during execution.
          </div>
        </div>

        <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs sm:p-7 lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7047eb]">
                Gateway Execution Pipeline
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#172033]">
                How the Security Workflow Operates
              </h2>
            </div>
            <Clock className="h-5 w-5 text-[#7047eb]" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-[#f0ebff] px-2 py-0.5 font-mono text-xs font-bold text-[#7047eb]">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-[#172033]">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#697386]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Level Capability Highlights */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7047eb]">
            Platform Architecture
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#172033]">
            Core Security & Investigation Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CORE_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="flex flex-col justify-between rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold tracking-tight text-[#172033]">
                      {cap.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[#697386] sm:text-sm">
                    {cap.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-[#edf0f5] pt-3.5">
                  <Link
                    href={cap.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7047eb] transition hover:text-[#5d36d6]"
                  >
                    {cap.linkLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Concise Audit & Ledger Entry Point */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs sm:flex-row sm:items-center">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f6fa] text-[#7047eb]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#172033] sm:text-base">
              Persisted SQLite Audit Ledger & Data Governance
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#697386]">
              All policy verdicts, consumed nonces, and multi-step Saga states
              are persisted to the local SQLite database for audit verification.
              Explore the ledger or review our data handling practices.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/security-ledger"
            className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] px-4 py-2 text-xs font-semibold text-[#172033] transition hover:border-[#d3c7ff]"
          >
            View Security Ledger
          </Link>
          <Link
            href="/privacy-policy"
            className="rounded-xl border border-[#e7e9f0] bg-white px-4 py-2 text-xs font-semibold text-[#697386] transition hover:text-[#172033]"
          >
            Privacy Policy
          </Link>
        </div>
      </section>
    </div>
  );
}
