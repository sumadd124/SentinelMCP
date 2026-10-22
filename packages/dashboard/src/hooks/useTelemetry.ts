"use client";

import { useEffect, useState, useRef } from "react";
import type { TelemetryEvent } from "../types/telemetry";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";

export function useTelemetry() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function connect() {
      const es = new EventSource(`${GATEWAY_URL}/sse`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data: TelemetryEvent = JSON.parse(event.data);
          setEvents((prev) => [data, ...prev.slice(0, 99)]);
        } catch (err) {
          console.error("Failed to parse SSE payload", err);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const clearEvents = () => setEvents([]);

  return { events, isConnected, clearEvents };
}