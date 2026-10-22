import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { db, runMigrations } from "./ledger/database.js";
import { broadcaster, logger } from "./telemetry/events.js";
import "./tools/handlers.js";
import { CapabilityTokenManager } from "./security/capability.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./mcp.js";

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

     // Read persisted security audit events
  server.get("/api/audit/events", async (request) => {
    const query = request.query as { limit?: string };
    const parsedLimit = Number(query.limit ?? 50);
    const limit = Number.isInteger(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50;

    const result = await db.execute({
      sql: `SELECT id, event_type, tool_name, verdict, reason, timestamp
            FROM audit_events
            ORDER BY id DESC
            LIMIT ?`,
      args: [limit],
    });

    return { events: result.rows };
  });

    server.post("/api/capability-tokens", async (request, reply) => {
    const body = request.body as {
      action?: string;
      scope?: string;
      maxAmount?: number;
    } | null;

    const allowedActions = [
      "execute_transfer",
      "delete_record",
      "send_email",
    ];

    if (
      !body ||
      typeof body.action !== "string" ||
      !allowedActions.includes(body.action) ||
      typeof body.scope !== "string" ||
      body.scope.trim().length === 0 ||
      body.scope.length > 200 ||
      (body.maxAmount !== undefined &&
        (!Number.isFinite(body.maxAmount) || body.maxAmount < 0))
    ) {
      return reply.code(400).send({ error: "Invalid token request" });
    }

    const token = CapabilityTokenManager.issue({
      action: body.action,
      scope: body.scope,
      expiresInSeconds: 300,
      maxAmount: body.maxAmount,
    });

    return {
      token,
      expiresInSeconds: 300,
      action: body.action,
      scope: body.scope,
    };
  });

  // MCP Streamable HTTP endpoint
  server.route({
    method: ["GET", "POST", "DELETE"],
    url: "/mcp",
    handler: async (request, reply) => {
      const mcp = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      reply.hijack();

      try {
        await mcp.connect(transport);
        await transport.handleRequest(request.raw, reply.raw, request.body);
      } catch (error) {
        logger.error(
          `MCP request failed: ${error instanceof Error ? error.message : String(error)}`
        );

        if (!reply.raw.headersSent) {
          reply.raw.statusCode = 500;
          reply.raw.setHeader("Content-Type", "application/json");
          reply.raw.end(JSON.stringify({ error: "MCP request failed" }));
        } else if (!reply.raw.writableEnded) {
          reply.raw.end();
        }
      } finally {
        await mcp.close().catch(() => undefined);
      }
    },
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