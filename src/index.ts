import { buildServer } from "./server.js";
import { config } from "./config.js";
import { runMigrations } from "./ledger/database.js";
import { logger } from "./telemetry/events.js";
import "./tools/handlers.js"; // Pre-load all tool definitions

async function main() {
  runMigrations();

  const server = buildServer();

  try {
    const address = await server.listen({
      port: config.PORT,
      host: config.HOST,
    });
    logger.info(`SentinelMCP Gateway listening at ${address}`);
    logger.info(`Guardrail Mode: ${config.BEDROCK_ENABLED ? "AWS Bedrock" : "Deterministic Local Demo"}`);
  } catch (err) {
    logger.error("Failed to start server:", { error: String(err) });
    process.exit(1);
  }

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();