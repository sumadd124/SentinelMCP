
import { createClient, type Client } from "@libsql/client";
import path from "node:path";
import fs from "node:fs";

const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

const useTurso = Boolean(tursoUrl);

if (useTurso && !tursoToken) {
  throw new Error(
    "TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL is set."
  );
}

const dbDir = path.resolve(process.cwd(), "data");

if (!useTurso && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "sentinel_ledger.db");

export const client: Client = useTurso
  ? createClient({
      url: tursoUrl!,
      authToken: tursoToken!,
    })
  : createClient({
      url: `file:${dbPath}`,
    });

export const db: Client = client;

export async function runMigrations(): Promise<void> {
  // These PRAGMA settings apply only to local SQLite.
  if (!useTurso) {
    await client.execute("PRAGMA journal_mode = WAL;");
    await client.execute("PRAGMA busy_timeout = 5000;");
    await client.execute("PRAGMA synchronous = NORMAL;");
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS mock_accounts (
      account_id TEXT PRIMARY KEY,
      balance REAL NOT NULL
    );
  `);

  await client.execute(`
    INSERT OR IGNORE INTO mock_accounts (account_id, balance)
    VALUES ('ACC_1001', 1000.0), ('ACC_2002', 200.0);
  `);

  // Nonces table for HMAC capability replay prevention.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS nonces (
      nonce TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      used_at INTEGER NOT NULL
    );
  `);

  // Saga transactions ledger table.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      initiator TEXT,
      client_id TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Step log and snapshot records for reverse compensation.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS transaction_steps (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      step_order INTEGER DEFAULT 1,
      tool_name TEXT NOT NULL,
      input_payload TEXT NOT NULL,
      output_payload TEXT,
      status TEXT NOT NULL,
      compensation_payload TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(transaction_id) REFERENCES transactions(id)
    );
  `);

  // Application records table used by sandbox tools.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Audit events table for Guardrail and Policy inspection history.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      tool_name TEXT,
      verdict TEXT NOT NULL,
      reason TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // Backward-compatible migrations for existing local databases
  // and databases created by earlier versions.
  try {
    await client.execute(
      "ALTER TABLE transactions ADD COLUMN initiator TEXT;"
    );
  } catch {
    // Column already exists.
  }

  try {
    await client.execute(
      "ALTER TABLE transactions ADD COLUMN client_id TEXT;"
    );
  } catch {
    // Column already exists.
  }

  try {
    await client.execute(
      "ALTER TABLE transaction_steps ADD COLUMN step_order INTEGER DEFAULT 1;"
    );
  } catch {
    // Column already exists.
  }

  try {
    await client.execute(
      "ALTER TABLE transaction_steps ADD COLUMN compensation_payload TEXT;"
    );
  } catch {
    // Column already exists.
  }
}

export async function getDatabase(): Promise<Client> {
  await runMigrations();
  return client;
}
