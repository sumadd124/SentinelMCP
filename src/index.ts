import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { pathToFileURL } from "url";
import { config } from "./config.js";
import { broadcaster } from "./telemetry/events.js";

export { broadcaster };

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // 1. Cross-Origin Resource Sharing
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  // 2. Service Root Index
  app.get("/", async () => {
    return {
      service: "SentinelMCP Gateway",
      version: "1.0.0",
      status: "active",
      endpoints: {
        health: "/health",
        telemetry: "/sse",
      },
    };
  });

  // 3. Health Endpoint
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });

  // 4. Telemetry SSE Endpoint with Direct CORS Injection
  app.get("/sse", async (request, reply) => {
    reply.hijack();

    const origin = request.headers.origin || "*";

    reply.raw.setHeader("Access-Control-Allow-Origin", origin);
    reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
    reply.raw.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");
    reply.raw.flushHeaders();

    // Initial connection payload
    const connectPayload = JSON.stringify({
      type: "SYSTEM_CONNECT",
      message: "Connected to SentinelMCP Telemetry Stream",
      timestamp: new Date().toISOString(),
    });
    reply.raw.write(`data: ${connectPayload}\n\n`);

    // Broadcast live telemetry events from shared broadcaster
    const onEvent = (eventData: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    broadcaster.on("telemetry", onEvent);

    // Keep-alive heartbeat every 15 seconds
    const heartbeat = setInterval(() => {
      reply.raw.write(": ping\n\n");
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      broadcaster.off("telemetry", onEvent);
    });
  });

  return app;
}

export async function startServer(overridePort?: number, overrideHost?: string) {
  try {
    const app = await buildApp();
    const port = overridePort ?? Number(process.env.PORT) ?? (config as any)?.PORT ?? 3001;
    const host = overrideHost ?? process.env.HOST ?? "0.0.0.0";

    await app.listen({ port, host });
    console.log(`[INFO] SentinelMCP Gateway listening at http://127.0.0.1:${port}`);
    console.log(`[INFO] Guardrail Mode: Deterministic Local Demo`);
  } catch (err) {
    console.error("[FATAL] Failed to boot SentinelMCP Gateway:", err);
    process.exit(1);
  }
}

// Windows-compatible entry execution check
const entryFileUrl = pathToFileURL(process.argv[1] || "").href;
const normalizedArgv = process.argv[1]?.replace(/\\/g, "/") || "";

if (
  import.meta.url === entryFileUrl ||
  normalizedArgv.endsWith("src/index.ts") ||
  normalizedArgv.endsWith("dist/index.js")
) {
  startServer();
}