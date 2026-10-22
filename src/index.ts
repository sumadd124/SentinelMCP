import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { runMigrations } from "./ledger/database.js";
import { broadcaster, logger } from "./telemetry/events.js";
import "./tools/handlers.js";

export const server: FastifyInstance = Fastify({
  logger: false,
});

async function registerRoutesAndPlugins(app: FastifyInstance): Promise<void> {
  // 1. Enable CORS for local development
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  });

  // 2. Health check
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // 3. Telemetry SSE Endpoint
  app.get("/sse", async (request, reply) => {
    // Hijack Fastify's response lifecycle to handle raw streaming
    reply.hijack();

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no"); // Prevent NGINX buffering if proxied
    reply.raw.flushHeaders();

    // Send initial handshake event
    const connectPayload = JSON.stringify({
      type: "SYSTEM_CONNECT",
      message: "Connected to SentinelMCP Telemetry Stream",
      timestamp: new Date().toISOString(),
    });
    reply.raw.write(`data: ${connectPayload}\n\n`);

    // Stream live events from the broadcaster
    const onEvent = (eventData: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    broadcaster.on("telemetry", onEvent);

    // Keep-alive ping every 15s
    const heartbeat = setInterval(() => {
      reply.raw.write(": ping\n\n");
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      broadcaster.off("telemetry", onEvent);
    });
  });
}

export async function startServer(
  port: number = Number(process.env.PORT) || 3001,
  host: string = process.env.HOST || "127.0.0.1"
): Promise<void> {
  try {
    await runMigrations();
    await registerRoutesAndPlugins(server);

    await server.listen({ port, host });
    logger.info(`SentinelMCP Gateway listening at http://${host}:${port}`);
    logger.info(
      `Guardrail Mode: ${
        config.BEDROCK_ENABLED ? "AWS Bedrock Active" : "Deterministic Local Demo"
      }`
    );
  } catch (err) {
    logger.error("Failed to start gateway server:", err);
    process.exit(1);
  }
}

// Auto-start if executed directly (e.g. tsx watch src/index.ts)
if (process.argv[1]?.replace(/\\/g, "/").endsWith("src/index.ts")) {
  const defaultPort = Number(process.env.PORT) || 3001;
  const defaultHost = process.env.HOST || "127.0.0.1";
  startServer(defaultPort, defaultHost);
}