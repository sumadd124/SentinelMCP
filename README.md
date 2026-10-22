# SentinelMCP 🛡️

**A locally runnable, zero-trust security gateway, policy enforcer, and transaction monitor for the Model Context Protocol (MCP).**

SentinelMCP sits between AI agent runtimes (Claude Desktop, custom agentic frameworks, LLM orchestrators) and backend MCP tool servers. It acts as an active policy enforcement firewall that prevents unauthorized invocations, stops prompt injection attacks before tool execution, guards high-value actions with cryptographically signed capability tokens, and guarantees data consistency across multi-step agent plans using compensating Saga rollback transactions.

---
## 🏛️ System Architecture

                               ┌────────────────────────────────────────────────────────┐
                               │               Host AI Agent / Client                   │
                               │        (Claude Desktop, Custom LLM Pipeline)           │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           │ Standard MCP Protocol
                                                           │ (JSON-RPC 2.0 via Stdio / SSE Transport)
                                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  SentinelMCP Gateway Core                                             │
│                                                                                                                       │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                       Incoming Request Interception Layer                                     │   │
│   │  - JSON-RPC message validation                                                                                │   │
│   │  - Schema unmarshalling & parsing                                                                             │   │
│   │  - Initial transaction lifecycle initialization (UUID assignment)                                            │   │
│   └──────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┘   │
│                                                          │                                                            │
│                                                          ▼                                                            │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                      Zero-Trust Policy Enforcement Engine                                     │   │
│   │                                                                                                               │   │
│   │   1. Cryptographic Capability Verification                                                                    │   │
│   │      ├── Signature Check: Constant-time HMAC-SHA256 verification via shared secret                            │   │
│   │      ├── Expiration Check: Epoch timestamp boundary evaluation (TTL enforcement)                             │   │
│   │      ├── Scope & Action Binding: Confirms tool invocation matches authorized claims                           │   │
│   │      └── Replay Protection: Atomic nonce lookup and immediate burn in SQLite store                            │   │
│   │                                                                                                               │   │
│   │   2. Dual-Tier Input Guardrail Analysis                                                                      │   │
│   │      ├── Primary (Cloud): AWS Bedrock Guardrails evaluation (if enabled)                                      │   │
│   │      └── Fallback (Deterministic): Offline regex heuristic scanner (prompt injection, overrides, leaks)       │   │
│   │                                                                                                               │   │
│   │   3. Schema & Numerical Boundary Enforcement                                                                 │   │
│   │      └── Zod runtime schema parsing, threshold checking, max-amount ceiling validation                      │   │
│   └──────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┘   │
│                                                          │                                                            │
│                                  ┌───────────────────────┴───────────────────────┐                                    │
│                                  │                                               │                                    │
│                     Verdict: ALLOWED                                Verdict: BLOCKED                                  │
│                                  │                                               │                                    │
│                                  ▼                                               ▼                                    │
│   ┌──────────────────────────────────────────────────────────┐    ┌───────────────────────────────────────────────┐   │
│   │                  Saga Transaction Ledger                 │    │             Security & Audit Logger           │   │
│   │  - Persists initial step record with status = 'STARTED'  │    │  - Appends to audit_events table              │   │
│   │  - Stores input arguments snapshot                       │    │  - Captures rule triggered & violating payload│   │
│   └──────────────────────────────┬───────────────────────────┘    └──────────────────────┬────────────────────────┘   │
│                                  │                                                       │                            │
│                                  ▼                                                       │                            │
│   ┌──────────────────────────────────────────────────────────┐                           │                            │
│   │                   Tool Registry & Sandbox                │                           │                            │
│   │  - Invokes underlying handler with execution context     │                           │                            │
│   │  - Sandbox execution:                                    │                           │                            │
│   │    • execute_transfer / check_balance                    │                           │                            │
│   │    • read_invoice                                        │                           │                            │
│   │    • create_user_record / delete_record                  │                           │                            │
│   │    • send_email                                          │                           │                            │
│   └──────────────────────────────┬───────────────────────────┘                           │                            │
│                                  │                                                       │                            │
│                     ┌────────────┴────────────┐                                          │                            │
│                     │                         │                                          │                            │
│             Execution SUCCESS         Execution FAILURE                                  │                            │
│                     │                         │                                          │                            │
│                     ▼                         ▼                                          │                            │
│   ┌────────────────────────────────┐  ┌───────────────────────────────────────┐          │                            │
│   │ Transaction Status: COMMITTED  │  │   Saga Compensating Rollback Engine   │          │                            │
│   │  - Updates step to 'SUCCESS'   │  │  - Traverses executed steps in LIFO   │          │                            │
│   │  - Stores output payload       │  │    reverse order                      │          │                            │
│   │  - Completes transaction run   │  │  - Executes inverse handlers:         │          │                            │
│   │                                │  │    • Reverse account credit/debit     │          │                            │
│   │                                │  │    • Restore deleted DB records       │          │                            │
│   │                                │  │    • Cancel queued email outbox drafts│          │                            │
│   │                                │  │  - Updates status to 'ROLLED_BACK'    │          │                            │
│   └────────────────┬───────────────┘  └──────────────────┬────────────────────┘          │                            │
│                    │                                     │                               │                            │
│                    └──────────────────┬──────────────────┘                               │                            │
│                                       │                                                  │                            │
│                                       ▼                                                  │                            │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐   │                            │
│   │                         Real-Time Telemetry Event Bus                            │◄──┘                            │
│   │  Emits structured events:                                                        │                                │
│   │  • TOOL_REQUEST               • TOOL_VERDICT (ALLOWED / BLOCKED)                 │                                │
│   │  • SAGA_ROLLBACK_INITIATED    • TRANSACTION_COMMITTED                            │                                │
│   └───────────────────────────────────────────┬──────────────────────────────────────┘                                │
└───────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┘
                                                │
                                                │ Server-Sent Events (SSE) Stream
                                                │ GET /sse
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │             Observability Client              │
                        │          (Next.js Web Dashboard)              │
                        │  - Real-time audit log stream                 │
                        │  - Visual Saga step inspector & rollbacks     │
                        │  - Capability Token Generation Studio         │
                        └───────────────────────────────────────────────┘
---

## 🧱 Core Subsystems

### 1. Capability Token Engine (Zero-Trust Proof of Intent)
- Enforces explicit cryptographic authorization for sensitive tool invocations (e.g., executing money transfers, deleting records).
- Generates and validates **HMAC-SHA256 signed capability tokens** structured with specific action permissions, scope restrictions, and strict TTL limits.
- Persists UUID-based nonces in SQLite to guarantee **single-use replay attack prevention**.

### 2. Dual-Tier Guardrail Engine
- Inspects target input parameters prior to tool execution for jailbreaks, prompt injections, and system overrides.
- Dual execution strategy:
  - **AWS Bedrock Guardrails:** Cloud-native evaluation when credentials are present.
  - **Deterministic Local Guardrail Fallback:** Offline regex-based pattern matching (e.g., catching `ignore previous instructions`, `bypass rules`) ensuring zero external dependencies during local development.

### 3. Saga Distributed Transaction Ledger
- Tracks multi-step autonomous agent actions inside a local SQLite ledger (`@libsql/client` with WAL mode and exponential busy timeouts).
- Records step parameters, forward outputs, and execution states (`STARTED`, `COMMITTED`, `ROLLED_BACK`).
- If an agent plan fails midway or downstream guardrails reject a dependent step, the **Saga Rollback Engine** automatically triggers compensating actions in reverse order to return databases and records to their original clean state.

### 4. Official MCP Protocol Adapter
- Connects directly into standard MCP client orchestrators using `@modelcontextprotocol/sdk`.
- Exposes typed Zod schemas, auto-wires safety wrappers around tool execution, and returns structured errors when policies deny requests.

---

## 📋 What Has Been Built (Completed)

- [x] **Monorepo & Build Foundation:** Strict TypeScript (ES2022, NodeNext), Fastify server setup, and dependency layout.
- [x] **Windows-Native SQLite Pipeline:** Configured `@libsql/client` running on pure JS/Wasm bindings to bypass native `node-gyp` C++ compilation issues on Windows and newer Node runtimes.
- [x] **Singleton Tool Registry:** Dynamic registration supporting Zod schemas, security policies, context passing, and reverse compensations.
- [x] **Mock Sandbox Suite:** 6 fully functional tools:
  - `read_invoice`: Static invoice retrieval.
  - `check_balance`: Query account ledger.
  - `execute_transfer` / `simulate_transfer`: Balance adjustments protected by capability tokens and reversible via saga compensation.
  - `create_user_record`: Monitored text persistence (with content inspection).
  - `delete_record`: Hard deletion protected by capability tokens with undo recovery.
  - `send_email`: Outbox drafting verified by dual guardrails.
- [x] **Saga Ledger & Auto-Rollback Engine:** Database tables (`transactions`, `transaction_steps`, `nonces`, `records`, `audit_events`) with complete schema self-healing migrations and automated reverse rollbacks.
- [x] **HMAC Capability Token Manager:** Issuance, parsing, signature validation, TTL enforcement, and anti-replay nonce tracking.
- [x] **Telemetry & SSE Stream:** Fastify event broadcaster pushing live `TOOL_REQUEST`, `TOOL_VERDICT`, and `SAGA_ROLLBACK_INITIATED` telemetry down `/sse`.
- [x] **Vitest Test Suite (100% Passing):**
  - `tests/capability.test.ts` (4/4 tests passed)
  - `tests/policy.test.ts` (2/2 tests passed)
  - `tests/transactions.test.ts` (1/1 test passed)
  - `tests/mcp.integration.test.ts` (1/1 test passed via In-Memory MCP transport)

---

## 🚧 What Is Left To Do

- [ ] **Stage 5: Real-Time Monitoring Dashboard (Next.js)**
  - Scaffold Next.js frontend in `packages/dashboard` (or standalone UI).
  - Connect to Gateway Server-Sent Events endpoint (`http://localhost:3000/sse`).
  - Render real-time feed: incoming tool executions, pass/block verdicts, and payload details.
  - Build UI Capability Token Generator (generate signed test tokens directly from browser).
  - Add Ledger Transaction Inspector (visualize multi-step saga executions and compensation triggers).
- [ ] **Workspace Decoupling (Monorepo Optimization)**
  - Split root code into clean `packages/gateway` and `packages/dashboard` npm workspaces.
- [ ] **Production Packaging & CLI Runner**
  - Add an executable CLI bin script (`sentinelmcp start`) for one-command local launching.
- [ ] **Claude Desktop Integration Guide**
  - Document `claude_desktop_config.json` setup to hook Claude directly into SentinelMCP over SSE or stdio.

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+
- **OS**: Windows, macOS, or Linux

### 1. Installation
```powershell
# Clone the repository
git clone [https://github.com/](https://github.com/)<YOUR_GITHUB_USERNAME>/sentinelmcp.git
cd sentinelmcp

# Install dependencies
npm install

2. Environment SetupCopy the sample environment configuration:PowerShellcp .env.example .env
Default parameters in .env:Code snippetPORT=3000
HOST=127.0.0.1
NODE_ENV=development
LOG_LEVEL=info
CAPABILITY_SECRET=sentinel-local-dev-secret-32-chars-min
BEDROCK_ENABLED=false
DATABASE_PATH=data/sentinel_ledger.db
3. Verification & Type CheckingPowerShell# Run TypeScript compilation checks
npm run typecheck

# Run test suite
npm test
4. Running the SentinelMCP GatewayPowerShell# Start local gateway server
npm run dev
The server will boot on http://127.0.0.1:3000:Healthcheck: GET http://127.0.0.1:3000/healthTelemetry Stream: GET http://127.0.0.1:3000/sseAudit History API: GET http://127.0.0.1:3000/api/audit/events📂 Project Directory Structuresentinelmcp/
├── data/                      # Local SQLite database & WAL journal logs
├── src/
│   ├── config.ts              # Zod-validated environment config
│   ├── index.ts               # Gateway bootstrap entrypoint
│   ├── mcp.ts                 # MCP Server protocol adapter & middleware
│   ├── server.ts              # Fastify HTTP & SSE streaming server
│   ├── ledger/
│   │   ├── database.ts        # @libsql/client setup & self-healing migrations
│   │   ├── rollback.ts        # Saga compensation execution engine
│   │   └── transactions.ts    # Transaction state tracking & step logs
│   ├── security/
│   │   ├── capability.ts      # HMAC token issuance & replay prevention
│   │   ├── guardrail.ts       # AWS Bedrock + Regex fallback guardrail
│   │   └── policy.ts          # Unified tool policy enforcement engine
│   ├── telemetry/
│   │   └── events.ts          # Central EventEmitter for SSE streaming
│   └── tools/
│       ├── handlers.ts        # 6 sandbox tools & compensations
│       ├── registry.ts        # Singleton tool registry
│       └── types.ts           # Core interfaces & security policy contracts
└── tests/
    ├── capability.test.ts     # Token issuance, replay & TTL tests
    ├── mcp.integration.test.ts# MCP SDK In-Memory transport integration test
    ├── policy.test.ts         # Guardrail injection block & pass tests
    └── transactions.test.ts   # Saga execution & reverse rollback tests
🧪 Testing CoverageTest FileCovered ComponentsTarget Resulttests/capability.test.tsHMAC signing, Nonces, Anti-Replay, ExpirationPASS (4/4)tests/policy.test.tsLocal regex fallback, Content inspectionPASS (2/2)tests/transactions.test.tsSaga forward step logging, Reversal on errorPASS (1/1)tests/mcp.integration.test.tsIn-memory MCP client handshake & listingPASS (1/1)
