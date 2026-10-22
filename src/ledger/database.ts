import { createClient, type Client } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'sentinel_ledger.db');

export const client: Client = createClient({
  url: `file:${dbPath}`,
});

export const db: Client = client;

export async function runMigrations(): Promise<void> {
  await client.execute('PRAGMA journal_mode = WAL;');
  await client.execute('PRAGMA busy_timeout = 5000;');
  await client.execute('PRAGMA synchronous = NORMAL;');

  // Nonces table for HMAC capability replay prevention
  await client.execute(`
    CREATE TABLE IF NOT EXISTS nonces (
      nonce TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      used_at INTEGER NOT NULL
    );
  `);

  // Saga transactions ledger table
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

  try {
    await client.execute(`ALTER TABLE transactions ADD COLUMN initiator TEXT;`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE transactions ADD COLUMN client_id TEXT;`);
  } catch {}

  // Step log & snapshot records for reverse compensation
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

  try {
    await client.execute(`ALTER TABLE transaction_steps ADD COLUMN step_order INTEGER DEFAULT 1;`);
  } catch {}
  try {
    await client.execute(`ALTER TABLE transaction_steps ADD COLUMN compensation_payload TEXT;`);
  } catch {}

  // Application records table used by sandbox tools
  await client.execute(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Audit events table for Guardrail & Policy inspection history
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
}

export async function getDatabase(): Promise<Client> {
  await runMigrations();
  return client;
}