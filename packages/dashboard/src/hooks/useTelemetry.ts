"use client";

import { useEffect, useState } from "react";
import type { TelemetryEvent } from "../types/telemetry";

function getSseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() || "http://127.0.0.1:3001";
  const sanitized = rawUrl.replace(/\/+$/, "");
  return sanitized.endsWith("/sse") ? sanitized : `${sanitized}/sse`;
}

export function useTelemetry() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sseUrl = getSseUrl();
    const es = new EventSource(sseUrl);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        setEvents((prev) => [parsed, ...prev.slice(0, 49)]);
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    return () => {
      es.close();
    };
  }, []);

  const clearEvents = () => setEvents([]);

  return { events, isConnected, clearEvents };
}