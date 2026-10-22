#!/usr/bin/env node
import { startServer } from "./index.js";
import { startStdioServer } from "./transports/stdio.js";
import { runMigrations } from "./ledger/database.js";
import "./tools/handlers.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || "stdio";

  await runMigrations();

  if (mode === "http" || mode === "gateway") {
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || "127.0.0.1";
    await startServer(port, host);
  } else if (mode === "stdio") {
    await startStdioServer();
  } else {
    process.stderr.write(
      `Unknown mode: ${mode}\nUsage: sentinelmcp [stdio | http]\n`
    );
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal CLI Error: ${message}\n`);
  process.exit(1);
});