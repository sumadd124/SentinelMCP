import { EventEmitter } from "node:events";

export interface TelemetryEvent {
  type: string;
  toolName?: string;
  transactionId?: string;
  verdict?: "ALLOWED" | "BLOCKED";
  reason?: string;
  params?: Record<string, unknown>;
  timestamp?: string;
  [key: string]: unknown;
}

class TelemetryBroadcaster extends EventEmitter {
  broadcast(event: TelemetryEvent): void {
    const payload = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    this.emit("telemetry", payload);
  }
}

export const broadcaster = new TelemetryBroadcaster();

export const logger = {
  info: (msg: string, meta?: unknown) => console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : ""),
  warn: (msg: string, meta?: unknown) => console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : ""),
  error: (msg: string, meta?: unknown) => console.error(`[ERROR] ${msg}`, meta ? JSON.stringify(meta) : ""),
};