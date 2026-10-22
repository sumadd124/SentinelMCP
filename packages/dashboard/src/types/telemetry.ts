export type TelemetryEventType =
  | "SYSTEM_CONNECT"
  | "TOKEN_ISSUED"
  | "TRANSACTION_INITIATED"
  | "TOOL_REQUEST"
  | "TOOL_VERDICT"
  | "SAGA_ROLLBACK_INITIATED"
  | "COMPENSATION_EXECUTED"
  | "COMPENSATION_FAILED"
  | "ROLLBACK_COMPLETED"
  | "TRANSACTION_COMMITTED"
  | "AUDIT_HISTORY";

export interface TelemetryEvent {
  type: TelemetryEventType;
  toolName?: string;
  transactionId?: string;
  verdict?: "ALLOWED" | "BLOCKED";
  reason?: string;
  params?: Record<string, unknown>;
  timestamp: string;
  message?: string;
  source?: "live_sse" | "audit_db";
}

export interface AuditEventRow {
  id: number;
  event_type: string;
  tool_name: string | null;
  verdict: "ALLOWED" | "BLOCKED";
  reason: string | null;
  timestamp: string;
}

export interface TransactionRow {
  id: string;
  initiator: string | null;
  client_id: string | null;
  status: "STARTED" | "COMPLETED" | "ROLLED_BACK" | "ROLLBACK_FAILED" | "BLOCKED";
  created_at: string;
  updated_at: string;
}

export interface TransactionStepRow {
  id: string;
  transaction_id: string;
  step_order: number;
  tool_name: string;
  input_payload: string;
  output_payload: string | null;
  status: "SUCCESS" | "COMPENSATED" | "COMPENSATION_FAILED";
  compensation_payload: string | null;
  created_at: string;
}

export interface MockAccountRow {
  account_id: string;
  balance: number;
}
