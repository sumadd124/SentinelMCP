import { runMigrations } from "../ledger/database.js";
import { startStdioServer } from "./stdio.js";
import "../tools/handlers.js";

async function main(): Promise<void> {
  await runMigrations();
  await startStdioServer();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Stdio Runner Error: ${message}\n`);
  process.exit(1);
});