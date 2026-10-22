import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { db } from "./ledger/database.js";
import { broadcaster } from "./telemetry/events.js";

export function buildServer() {
  const fastify = Fastify({
    logger: false,
    bodyLimit: 1048576, // 1MB payload ceiling
  });

  fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow localhost dashboard origin or requests without origin (like direct curl/local tools)
      if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        cb(null, true);
        return;
      }
      cb(new Error("Origin not allowed by Sentinel CORS policy"), false);
    },
  });

  // Health endpoint
  fastify.get("/health", async (_request, reply) => {
    return reply.status(200).send({
      status: "HEALTHY",
      service: "SentinelMCP Gateway",
      timestamp: new Date().toISOString(),
    });
  });

  // Audit events API for Dashboard
  fastify.get("/api/audit/events", async (_request, reply) => {
    try {
      const result = await db.execute("SELECT * FROM audit_events ORDER BY id DESC LIMIT 20");
      return reply.send({ events: result.rows });
    } catch {
      return reply.send({ events: [] });
    }
  });

  // Server-Sent Events (SSE) stream for real-time dashboard telemetry
  fastify.get("/sse", async (_request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("Access-Control-Allow-Origin", "*");
    reply.raw.flushHeaders();

    const sendEvent = (event: Record<string, unknown>) => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    broadcaster.on("telemetry", sendEvent);

    // Initial heartbeat
    sendEvent({
      type: "SYSTEM_CONNECT",
      message: "Connected to SentinelMCP telemetry bus",
      timestamp: new Date().toISOString(),
    });

    reply.raw.on("close", () => {
      broadcaster.off("telemetry", sendEvent);
    });
  });

  return fastify;
}

export async function startServer() {
  const server = buildServer();
  try {
    await server.listen({ port: config.PORT, host: config.HOST });
    console.log(`[SentinelMCP] Gateway listening on http://${config.HOST}:${config.PORT}`);
    return server;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}