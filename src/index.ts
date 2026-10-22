import Fastify from "fastify";
import cors from "@fastify/cors";
import { runMigrations } from "./ledger/database.js";
import { broadcaster, logger } from "./telemetry/events.js";
import "./tools/handlers.js";

const server = Fastify({
  logger: false,
});

async function bootstrap() {
  await runMigrations();

  // 1. Enable CORS for local development (allows dashboard on port 3001/3000)
  await server.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  // 2. Health check
  server.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // 3. Telemetry SSE Endpoint
  server.get("/sse", async (request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.flushHeaders();

    // Send initial handshake event
    const connectPayload = JSON.stringify({
      type: "SYSTEM_CONNECT",
      message: "Connected to SentinelMCP Telemetry Stream",
      timestamp: new Date().toISOString(),
    });
    reply.raw.write(`data: ${connectPayload}\n\n`);

    // Stream live events from the broadcaster
    const onEvent = (eventData: any) => {
      reply.raw.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    broadcaster.on("telemetry", onEvent);

    // Keep-alive ping every 15s to prevent socket timeouts
    const heartbeat = setInterval(() => {
      reply.raw.write(": ping\n\n");
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      broadcaster.off("telemetry", onEvent);
    });
  });

  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || "127.0.0.1";

  await server.listen({ port, host });
  logger.info(`SentinelMCP Gateway listening at http://${host}:${port}`);
  logger.info(`Guardrail Mode: Deterministic Local Demo`);
}

bootstrap().catch((err) => {
  console.error("Gateway bootstrap failed:", err);
  process.exit(1);
});