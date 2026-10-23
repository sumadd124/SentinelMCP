import React from "react";
import {
  FileText,
  Database,
  ShieldCheck,
  AlertTriangle,
  Server,
  Lock,
} from "lucide-react";

const POLICY_SECTIONS = [
  { id: "information-collected", title: "1. Information Collected & Processed" },
  { id: "telemetry-and-logs", title: "2. Security Events, Logs & Telemetry" },
  { id: "purpose-of-processing", title: "3. Purpose of Processing" },
  { id: "storage-retention-deletion", title: "4. Storage, Retention & Deletion" },
  { id: "third-party-integrations", title: "5. Third-Party Integrations & External Services" },
  { id: "data-sharing-disclosure", title: "6. Data Sharing & Disclosure" },
  { id: "user-rights-choices", title: "7. User Rights & Privacy Choices" },
  { id: "security-measures", title: "8. Security Measures & Operational Caveats" },
  { id: "childrens-privacy", title: "9. Children's Privacy" },
  { id: "updates-and-contact", title: "10. Policy Updates & Contact Information" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0ebff] text-[#7047eb]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7047eb]">
                Audit & Compliance
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
                Privacy Policy & Data Handling Notice
              </h1>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800">
            Effective Date:{" "}
            <span className="font-mono">
              [PLACEHOLDER: Insert Publication Date]
            </span>
          </div>
        </div>

        <p className="mt-4 max-w-4xl text-sm leading-6 text-[#465066]">
          This Privacy Policy documents how{" "}
          <strong>SentinelMCP</strong> (the Model Context Protocol Security
          Gateway and Command Center Dashboard) collects, processes, stores, and
          transmits data based on the actual repository implementation. Items
          marked with{" "}
          <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-amber-800">
            [PLACEHOLDER: ...]
          </code>{" "}
          depend on the deploying organization&apos;s legal entity, hosting
          environment, and governance policies and must be reviewed and
          completed prior to production publication.
        </p>

        {/* Quick Navigation */}
        <div className="mt-6 border-t border-[#edf0f5] pt-4">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-[#8790a2]">
            Document Sections
          </p>
          <div className="flex flex-wrap gap-2">
            {POLICY_SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className="rounded-lg border border-[#e7e9f0] bg-[#fcfcfe] px-2.5 py-1 text-xs font-medium text-[#465066] transition hover:border-[#d3c7ff] hover:text-[#7047eb]"
              >
                {sec.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Policy Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {/* 1. Information Collected & Processed */}
          <section
            id="information-collected"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              1. Information Collected & Processed
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              When AI agents, MCP clients, or operators interact with the
              SentinelMCP Gateway and Dashboard, the application processes and
              records the following categories of data:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                <strong>MCP Tool Invocation Payloads:</strong> Tool names (
                <code className="font-mono text-xs text-[#7047eb]">
                  tool_name
                </code>
                ), complete serialized JSON input parameters (
                <code className="font-mono text-xs text-[#7047eb]">
                  input_payload
                </code>
                ), and tool handler return values (
                <code className="font-mono text-xs text-[#7047eb]">
                  output_payload
                </code>
                ). Depending on the tools invoked, these payloads may include
                account identifiers, transfer amounts, invoice identifiers,
                free-form record text (
                <code className="font-mono text-xs text-[#7047eb]">
                  content
                </code>
                ), and email parameters (recipient address{" "}
                <code className="font-mono text-xs text-[#7047eb]">to</code>,{" "}
                <code className="font-mono text-xs text-[#7047eb]">
                  subject
                </code>
                , and{" "}
                <code className="font-mono text-xs text-[#7047eb]">body</code>).
              </li>
              <li>
                <strong>Cryptographic Capability Token Claims:</strong> Signed
                capability tokens submitted to or issued by the gateway (
                <code className="font-mono text-xs text-[#7047eb]">
                  POST /api/tokens/issue
                </code>
                ), including target action, resource scope, maximum transaction
                amount ceiling, expiration Unix timestamp, and UUIDv4 nonces.
              </li>
              <li>
                <strong>Transaction & Client Context Identifiers:</strong>{" "}
                Generated transaction IDs (
                <code className="font-mono text-xs text-[#7047eb]">tx_*</code>),
                step IDs (
                <code className="font-mono text-xs text-[#7047eb]">stp_*</code>
                ), and initiator/client labels (such as{" "}
                <code className="font-mono text-xs">mcp-client</code>,{" "}
                <code className="font-mono text-xs">dashboard-lab</code>, or{" "}
                <code className="font-mono text-xs">
                  saga-multi-step-agent
                </code>
                ).
              </li>
              <li>
                <strong>Browser UI Preferences:</strong> The dashboard stores
                the desktop sidebar navigation state (
                <code className="font-mono text-xs text-[#7047eb]">
                  sentinel_sidebar_collapsed
                </code>
                ) in the user&apos;s browser{" "}
                <code className="font-mono text-xs">window.localStorage</code>.
              </li>
            </ul>
          </section>

          {/* 2. Security Events, Logs & Telemetry */}
          <section
            id="telemetry-and-logs"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              2. Security Events, Logs & Telemetry
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              SentinelMCP is an observability and policy enforcement gateway;
              telemetry and security logging are active by design:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                <strong>Persisted Audit Events:</strong> Every policy evaluation
                in <code className="font-mono text-xs">PolicyEnforcer</code>{" "}
                writes a record to the SQLite{" "}
                <code className="font-mono text-xs text-[#7047eb]">
                  audit_events
                </code>{" "}
                table containing{" "}
                <code className="font-mono text-xs">event_type</code> (
                <code className="font-mono text-xs">TOOL_INVOCATION</code>),{" "}
                <code className="font-mono text-xs">tool_name</code>,{" "}
                <code className="font-mono text-xs">verdict</code> (
                <code className="font-mono text-xs">ALLOWED</code> or{" "}
                <code className="font-mono text-xs">BLOCKED</code>), the
                detailed <code className="font-mono text-xs">reason</code>, and
                an ISO-8601 <code className="font-mono text-xs">timestamp</code>
                .
              </li>
              <li>
                <strong>Real-Time SSE Telemetry Stream:</strong> The gateway
                broadcasts live events over{" "}
                <code className="font-mono text-xs text-[#7047eb]">
                  GET /sse
                </code>{" "}
                (including{" "}
                <code className="font-mono text-xs">SYSTEM_CONNECT</code>,{" "}
                <code className="font-mono text-xs">TOKEN_ISSUED</code>,{" "}
                <code className="font-mono text-xs">TRANSACTION_INITIATED</code>
                , <code className="font-mono text-xs">TOOL_REQUEST</code>,{" "}
                <code className="font-mono text-xs">TOOL_VERDICT</code>,{" "}
                <code className="font-mono text-xs">
                  SAGA_ROLLBACK_INITIATED
                </code>
                ,{" "}
                <code className="font-mono text-xs">COMPENSATION_EXECUTED</code>
                ,{" "}
                <code className="font-mono text-xs">ROLLBACK_COMPLETED</code>,
                and{" "}
                <code className="font-mono text-xs">TRANSACTION_COMMITTED</code>
                ). These events include tool arguments (
                <code className="font-mono text-xs">params</code>) and denial
                reasons. The browser dashboard buffers up to 100 live events in
                client memory.
              </li>
              <li>
                <strong>HTTP Server & Console Logs:</strong> The Fastify server
                runs with structured JSON logging enabled (
                <code className="font-mono text-xs">logger: true</code>), which
                writes request methods, URLs, status codes, response times,
                process IDs, hostnames, and client{" "}
                <code className="font-mono text-xs">remoteAddress</code> values
                to standard output/error.
              </li>
            </ul>
          </section>

          {/* 3. Purpose of Processing */}
          <section
            id="purpose-of-processing"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              3. Purpose of Processing
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              Information processed by SentinelMCP is used strictly for the
              following operational security functions:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                Verifying cryptographic capability tokens and enforcing
                least-privilege action and amount boundaries before executing
                MCP tools.
              </li>
              <li>
                Detecting and blocking prompt injections, cross-site scripting
                patterns, and unauthorized system overrides in untrusted tool
                inputs.
              </li>
              <li>
                Preventing single-use capability token replay attacks by
                checking and recording consumed UUIDv4 nonces.
              </li>
              <li>
                Maintaining transactional consistency across multi-step AI agent
                workflows by storing step input/output snapshots required to
                execute reverse Saga rollbacks on failure.
              </li>
              <li>
                Providing security operators with real-time monitoring, forensic
                incident timelines, and audit trail visibility.
              </li>
            </ul>
          </section>

          {/* 4. Storage, Retention & Deletion */}
          <section
            id="storage-retention-deletion"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              4. Storage, Retention & Deletion
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              <strong>Local SQLite Persistence:</strong> By default, the gateway
              persists data on the local host filesystem using{" "}
              <code className="font-mono text-xs">@libsql/client</code> in a
              SQLite database file located at{" "}
              <code className="font-mono text-xs text-[#7047eb]">
                data/sentinel_ledger.db
              </code>{" "}
              (with Write-Ahead Logging{" "}
              <code className="font-mono text-xs">PRAGMA journal_mode = WAL</code>{" "}
              enabled). The database contains six tables:{" "}
              <code className="font-mono text-xs">audit_events</code>,{" "}
              <code className="font-mono text-xs">transactions</code>,{" "}
              <code className="font-mono text-xs">transaction_steps</code>,{" "}
              <code className="font-mono text-xs">nonces</code>,{" "}
              <code className="font-mono text-xs">records</code>, and{" "}
              <code className="font-mono text-xs">mock_accounts</code>.
            </p>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              <strong>Retention & Deletion Behavior:</strong>
            </p>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                The application codebase does <strong>not</strong> currently
                implement automated TTL pruning, scheduled background deletion,
                or a UI/API endpoint that permanently purges historical rows
                from <code className="font-mono text-xs">audit_events</code>,{" "}
                <code className="font-mono text-xs">transactions</code>,{" "}
                <code className="font-mono text-xs">transaction_steps</code>, or{" "}
                <code className="font-mono text-xs">nonces</code>.
              </li>
              <li>
                Clicking <strong>Clear Stream</strong> in the dashboard clears
                only the volatile in-memory browser array of SSE events; it does{" "}
                <strong>not</strong> delete persisted records in{" "}
                <code className="font-mono text-xs">
                  data/sentinel_ledger.db
                </code>
                .
              </li>
              <li>
                When the <code className="font-mono text-xs">delete_record</code>{" "}
                tool deletes a row from the{" "}
                <code className="font-mono text-xs">records</code> table, its{" "}
                <code className="font-mono text-xs">previous_content</code> is
                captured in{" "}
                <code className="font-mono text-xs">
                  transaction_steps.output_payload
                </code>{" "}
                so that Saga compensation can restore the record if a multi-step
                transaction fails.
              </li>
              <li>
                Permanent removal of stored ledger and audit data currently
                requires administrative deletion or rotation of the SQLite
                database file (
                <code className="font-mono text-xs">
                  data/sentinel_ledger.db
                </code>
                ) on the host machine.
              </li>
              <li>
                <strong>Organizational Retention Schedule:</strong>{" "}
                <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs text-amber-800">
                  [PLACEHOLDER: Specify organizational log retention period,
                  archival policy, and database purge schedule before
                  publication]
                </code>
              </li>
            </ul>
          </section>

          {/* 5. Third-Party Integrations & External Services */}
          <section
            id="third-party-integrations"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              5. Third-Party Integrations & External Services
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                <strong>
                  Default Deterministic Local Guardrail (
                  <code className="font-mono text-xs">
                    BEDROCK_ENABLED=false
                  </code>
                  ):
                </strong>{" "}
                In its default configuration, SentinelMCP inspects tool text
                inputs locally using regular expressions (
                <code className="font-mono text-xs">
                  LocalDemoGuardrailProvider
                </code>
                ) and does not send tool payloads to external cloud guardrail
                APIs.
              </li>
              <li>
                <strong>
                  Optional AWS Bedrock Guardrails Integration (
                  <code className="font-mono text-xs">
                    BEDROCK_ENABLED=true
                  </code>
                  ):
                </strong>{" "}
                When operators explicitly enable AWS Bedrock in the environment
                configuration (
                <code className="font-mono text-xs">BEDROCK_ENABLED=true</code>,{" "}
                <code className="font-mono text-xs">AWS_REGION</code>,{" "}
                <code className="font-mono text-xs">BEDROCK_GUARDRAIL_ID</code>
                ), inspected text fields (such as{" "}
                <code className="font-mono text-xs">content</code>,{" "}
                <code className="font-mono text-xs">subject</code>, and{" "}
                <code className="font-mono text-xs">body</code>) are sent over
                HTTPS to Amazon Web Services via{" "}
                <code className="font-mono text-xs">
                  @aws-sdk/client-bedrock-runtime
                </code>{" "}
                (<code className="font-mono text-xs">ApplyGuardrailCommand</code>
                ) for content evaluation. Data processed through AWS Bedrock is
                governed by your organization&apos;s AWS account configuration
                and the AWS Service Terms.
              </li>
              <li>
                <strong>Typography Assets:</strong> The Next.js dashboard
                configures the <code className="font-mono text-xs">Geist</code>{" "}
                and <code className="font-mono text-xs">Geist_Mono</code> fonts
                via <code className="font-mono text-xs">next/font/google</code>.
              </li>
            </ul>
          </section>

          {/* 6. Data Sharing & Disclosure */}
          <section
            id="data-sharing-disclosure"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              6. Data Sharing & Disclosure
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              The SentinelMCP codebase does not embed third-party marketing
              trackers, advertising beacons, or external analytics SDKs. Data is
              only transmitted externally if the operator enables AWS Bedrock
              Guardrails (<code className="font-mono text-xs">BEDROCK_ENABLED=true</code>)
              or exposes the gateway network port to external hosts.
            </p>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              <strong>Organizational Disclosure Policy:</strong>{" "}
              <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs text-amber-800">
                [PLACEHOLDER: Specify circumstances under which the deploying
                organization may share audit logs with internal security teams,
                auditors, subprocessors, or law enforcement]
              </code>
            </p>
          </section>

          {/* 7. User Rights & Privacy Choices */}
          <section
            id="user-rights-choices"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              7. User Rights & Privacy Choices
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              Depending on how SentinelMCP is deployed and your applicable
              jurisdiction, operators and users have the following technical
              controls and privacy choices:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                <strong>Offline / Local-Only Inspection:</strong> Keep{" "}
                <code className="font-mono text-xs">BEDROCK_ENABLED=false</code>{" "}
                in <code className="font-mono text-xs">.env</code> so all
                guardrail evaluations run locally without external API calls.
              </li>
              <li>
                <strong>Local Database Access & Erasure:</strong> Self-hosted
                operators have direct filesystem access to inspect, query, export,
                or delete{" "}
                <code className="font-mono text-xs">
                  data/sentinel_ledger.db
                </code>
                .
              </li>
              <li>
                <strong>Browser Storage Reset:</strong> Users can clear{" "}
                <code className="font-mono text-xs">
                  sentinel_sidebar_collapsed
                </code>{" "}
                at any time via browser site data settings and clear in-memory
                SSE events via the <strong>Clear Stream</strong> button.
              </li>
              <li>
                <strong>Data Subject Requests (Hosted Deployments):</strong>{" "}
                <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs text-amber-800">
                  [PLACEHOLDER: Describe procedures for submitting access,
                  rectification, restriction, or erasure requests if deployed
                  as a managed or multi-user service]
                </code>
              </li>
            </ul>
          </section>

          {/* 8. Security Measures & Operational Caveats */}
          <section
            id="security-measures"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              8. Security Measures & Operational Caveats
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              <strong>Implemented Technical Controls:</strong>
            </p>
            <ul className="list-disc space-y-2 pl-5 text-xs leading-6 text-[#465066] sm:text-sm">
              <li>
                <strong>Constant-Time HMAC-SHA256 Verification:</strong>{" "}
                Capability tokens are signed with{" "}
                <code className="font-mono text-xs">CAPABILITY_SECRET</code>{" "}
                (enforced minimum length of 32 characters via Zod configuration
                validation) and verified using{" "}
                <code className="font-mono text-xs">
                  crypto.timingSafeEqual
                </code>{" "}
                to mitigate timing side-channel attacks.
              </li>
              <li>
                <strong>Single-Use Nonce & TTL Enforcement:</strong> Consumed
                token nonces are persisted in SQLite to block replay attacks, and
                expired tokens are rejected prior to handler execution.
              </li>
              <li>
                <strong>Fail-Closed Guardrails & Payload Limits:</strong> If AWS
                Bedrock is enabled without a valid guardrail identifier or
                encounters a runtime error, the gateway fails closed and blocks
                the tool call. Fastify enforces a 1 MB request payload limit (
                <code className="font-mono text-xs">bodyLimit: 1048576</code>).
              </li>
            </ul>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-5 text-amber-900">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                Important Operational Caveats for Production Deployment
              </div>
              <p className="mt-1">
                In the current repository implementation, the HTTP gateway
                endpoints (<code className="font-mono">/sse</code>,{" "}
                <code className="font-mono">/api/audit/events</code>,{" "}
                <code className="font-mono">/api/transactions</code>,{" "}
                <code className="font-mono">/api/tokens/issue</code>,{" "}
                <code className="font-mono">/api/tools/execute</code>,{" "}
                <code className="font-mono">/api/attack-lab/run</code>) do not
                enforce user authentication and allow cross-origin requests (
                <code className="font-mono">origin: true</code> in{" "}
                <code className="font-mono">src/index.ts</code>). Furthermore,
                the SQLite database is stored unencrypted on disk. Before
                production use, operators must bind the gateway to a restricted
                interface (<code className="font-mono">127.0.0.1</code>) or
                place it behind an authenticated reverse proxy with TLS, and
                replace any development <code className="font-mono">CAPABILITY_SECRET</code>.
              </p>
            </div>
          </section>

          {/* 9. Children's Privacy */}
          <section
            id="childrens-privacy"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-2"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              SentinelMCP is an infrastructure security and developer operations
              tool designed for software engineers and security teams managing
              Model Context Protocol agents. It is not directed at children, and
              it is not intended to collect personal information from children.{" "}
              <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs text-amber-800">
                [PLACEHOLDER: Insert jurisdiction-specific minimum age language
                and contact procedure if applicable]
              </code>
            </p>
          </section>

          {/* 10. Policy Updates & Contact Information */}
          <section
            id="updates-and-contact"
            className="rounded-2xl border border-[#e7e9f0] bg-white p-6 shadow-xs space-y-3"
          >
            <h2 className="text-base font-bold tracking-tight text-[#172033]">
              10. Policy Updates & Contact Information
            </h2>
            <p className="text-xs leading-6 text-[#465066] sm:text-sm">
              This policy should be updated whenever new MCP tools, external
              guardrail providers, authentication layers, or database retention
              mechanisms are added to SentinelMCP.
            </p>
            <div className="rounded-xl border border-[#e7e9f0] bg-[#fcfcfe] p-4 text-xs leading-6 text-[#465066]">
              <p>
                <strong>Data Controller / Organization:</strong>{" "}
                <code className="font-mono text-amber-800">
                  [PLACEHOLDER: Organization Legal Name]
                </code>
              </p>
              <p>
                <strong>Privacy & Security Contact Email:</strong>{" "}
                <code className="font-mono text-amber-800">
                  [PLACEHOLDER: privacy@your-organization.example]
                </code>
              </p>
              <p>
                <strong>Mailing Address:</strong>{" "}
                <code className="font-mono text-amber-800">
                  [PLACEHOLDER: Organization Physical Address]
                </code>
              </p>
              <p>
                <strong>Compliance & Regulatory Attestations:</strong>{" "}
                <code className="font-mono text-amber-800">
                  [PLACEHOLDER: Do not claim GDPR, HIPAA, SOC 2, or ISO 27001
                  compliance until formally audited and verified by legal
                  counsel]
                </code>
              </p>
            </div>
          </section>
        </div>

        {/* Right Summary Sidebar Card */}
        <div className="space-y-5 lg:col-span-4">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-[#7047eb]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  Verified Storage Summary
                </h3>
              </div>
              <div className="space-y-2.5 text-xs text-[#465066]">
                <div className="rounded-lg bg-[#f7f8fc] p-3">
                  <span className="block font-mono text-[10px] font-bold uppercase text-[#8790a2]">
                    SQLite Database Path
                  </span>
                  <code className="mt-1 block font-mono font-semibold text-[#172033]">
                    data/sentinel_ledger.db
                  </code>
                </div>
                <div className="rounded-lg bg-[#f7f8fc] p-3">
                  <span className="block font-mono text-[10px] font-bold uppercase text-[#8790a2]">
                    Persisted SQLite Tables
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-[#7047eb]">
                    audit_events, transactions, transaction_steps, nonces,
                    records, mock_accounts
                  </p>
                </div>
                <div className="rounded-lg bg-[#f7f8fc] p-3">
                  <span className="block font-mono text-[10px] font-bold uppercase text-[#8790a2]">
                    Browser Client Storage
                  </span>
                  <p className="mt-1 font-mono text-[11px] text-[#172033]">
                    localStorage.sentinel_sidebar_collapsed
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7e9f0] bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <Server className="h-5 w-5 text-[#7047eb]" />
                <h3 className="text-sm font-bold text-[#172033]">
                  External Network Calls
                </h3>
              </div>
              <p className="text-xs leading-5 text-[#697386]">
                By default (<code className="font-mono">BEDROCK_ENABLED=false</code>
                ), tool content inspection runs locally via regex and makes zero
                external cloud guardrail calls. Enabling{" "}
                <code className="font-mono">BEDROCK_ENABLED=true</code> sends
                inspected text fields to AWS Bedrock Runtime in your configured{" "}
                <code className="font-mono">AWS_REGION</code>.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e7e9f0] bg-[#201448] p-5 text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
                <Lock className="h-4 w-4" />
                Verification Principle
              </div>
              <p className="text-xs leading-5 text-violet-100/90">
                Every statement on this page reflects verified behavior in{" "}
                <code className="font-mono text-violet-200">src/</code> and{" "}
                <code className="font-mono text-violet-200">
                  packages/dashboard/
                </code>
                . Unverified organizational policies are marked as placeholders
                for review.
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Codebase-verified disclosure
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
