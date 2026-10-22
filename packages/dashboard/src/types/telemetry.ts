export interface TelemetryEvent {
  type:
    | "SYSTEM_CONNECT"
    | "TOOL_REQUEST"
    | "TOOL_VERDICT"
    | "SAGA_ROLLBACK_INITIATED"
    | "TRANSACTION_COMMITTED";
  toolName?: string;
  transactionId?: string;
  verdict?: "ALLOWED" | "BLOCKED";
  reason?: string;
  params?: Record<string, unknown>;
  timestamp: string;
  message?: string;
}

export interface AuditEventRow {
  id: number;
  event_type: string;
  tool_name: string | null;
  verdict: string;
  reason: string | null;
  timestamp: string;
}