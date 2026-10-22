import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { TransactionLedger } from "../src/ledger/transactions.js";
import { db, runMigrations } from "../src/ledger/database.js";
import { ToolRegistry } from "../src/tools/registry.js";
import "../src/tools/handlers.js";

describe("Saga Transaction Ledger & Rollback Engine", () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS mock_accounts (
        account_id TEXT PRIMARY KEY,
        balance REAL NOT NULL
      );
    `);
    await db.execute("INSERT OR REPLACE INTO mock_accounts (account_id, balance) VALUES ('ACC_1001', 1000.0);");
    await db.execute("INSERT OR REPLACE INTO mock_accounts (account_id, balance) VALUES ('ACC_2002', 200.0);");
  });

  it("should record successful operations and reverse them on failure", async () => {
    const registry = ToolRegistry.getInstance();
    const transferTool = registry.get("simulate_transfer") || registry.get("execute_transfer");
    expect(transferTool).toBeDefined();

    const txId = await TransactionLedger.createTransaction("test-client");
    const input = {
      source_account: "ACC_1001",
      destination_account: "ACC_2002",
      amount: 150.0,
      capability_token: "MOCK_TOKEN",
    };

    const context = { transactionId: txId, clientId: "test-client", timestamp: new Date().toISOString() };
    const output = await transferTool!.handler(input as any, context as any);

    await TransactionLedger.recordStepSuccess(txId, transferTool!.name, input, output);

    let acc1Res = await db.execute({
      sql: "SELECT balance FROM mock_accounts WHERE account_id = ?",
      args: ["ACC_1001"],
    });
    let acc1 = acc1Res.rows[0] as unknown as { balance: number } | undefined;
    if (acc1) {
      expect(Number(acc1.balance)).toBeLessThan(1000.0);
    }

    await TransactionLedger.failTransaction(txId, "Downstream failure");

    acc1Res = await db.execute({
      sql: "SELECT balance FROM mock_accounts WHERE account_id = ?",
      args: ["ACC_1001"],
    });
    acc1 = acc1Res.rows[0] as unknown as { balance: number } | undefined;
    if (acc1) {
      expect(Number(acc1.balance)).toBe(1000.0);
    }

    const txStatusRes = await db.execute({
      sql: "SELECT status FROM transactions WHERE id = ?",
      args: [txId],
    });
    const txRow = txStatusRes.rows[0] as unknown as { status: string };
    expect(txRow.status).toBe("ROLLED_BACK");
  });
});