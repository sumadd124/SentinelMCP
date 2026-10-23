"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  AuditEventRow,
  MockAccountRow,
  TelemetryEvent,
  TransactionRow,
  TransactionStepRow,
} from "../types/telemetry";

export function getGatewayBaseUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() || "http://127.0.0.1:3001";
  return rawUrl.replace(/\/sse\/?$/, "").replace(/\/+$/, "");
}

function getSseUrl(): string {
  return `${getGatewayBaseUrl()}/sse`;
}

export interface TelemetryState {
  events: TelemetryEvent[];
  auditHistory: AuditEventRow[];
  transactions: TransactionRow[];
  transactionSteps: TransactionStepRow[];
  accounts: MockAccountRow[];
  isConnected: boolean;
  clearEvents: () => void;
  refreshBackendRecords: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryState | null>(null);

function useTelemetryInternal(enabled: boolean): TelemetryState {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditEventRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [transactionSteps, setTransactionSteps] = useState<TransactionStepRow[]>([]);
  const [accounts, setAccounts] = useState<MockAccountRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const refreshBackendRecords = useCallback(async () => {
    const baseUrl = getGatewayBaseUrl();
    try {
      const [auditRes, txRes] = await Promise.all([
        fetch(`${baseUrl}/api/audit/events`),
        fetch(`${baseUrl}/api/transactions`),
      ]);

      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditHistory(auditData.events || []);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
        setTransactionSteps(txData.steps || []);
        setAccounts(txData.accounts || []);
      }
    } catch {
      // Gateway may not be reachable yet
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(() => {
      void refreshBackendRecords();
    }, 0);

    const sseUrl = getSseUrl();
    const es = new EventSource(sseUrl);

    es.onopen = () => {
      setIsConnected(true);
      void refreshBackendRecords();
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data) as TelemetryEvent;
        const normalized: TelemetryEvent = {
          ...parsed,
          toolName:
            parsed.toolName ||
            (parsed as unknown as { tool?: string }).tool,
          source: "live_sse",
        };
        setEvents((prev) => [normalized, ...prev.slice(0, 99)]);
        void refreshBackendRecords();
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    return () => {
      window.clearTimeout(timer);
      es.close();
    };
  }, [enabled, refreshBackendRecords]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return {
    events,
    auditHistory,
    transactions,
    transactionSteps,
    accounts,
    isConnected,
    clearEvents,
    refreshBackendRecords,
  };
}

export function TelemetryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const state = useTelemetryInternal(true);
  return React.createElement(
    TelemetryContext.Provider,
    { value: state },
    children
  );
}

export function useTelemetry(): TelemetryState {
  const context = useContext(TelemetryContext);
  const fallback = useTelemetryInternal(context === null);
  return context ?? fallback;
}
